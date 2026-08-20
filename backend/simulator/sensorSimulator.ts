import fetch from "node-fetch";
import { eq, and } from "drizzle-orm";
import { db } from "../src/db/connection.js";
import { iotShields } from "../src/db/schema/iotShields.js";
import { iotShieldSensors } from "../src/db/schema/iotShieldSensors.js";

const API_URL = "http://localhost:3000/api/sensor-data";
const SEND_INTERVAL_MS = 3 * 60 * 1000;
const REFRESH_INTERVAL_MS = 30_000;

const ACTIVITIES = ["REST", "MOVEMENT", "GRAZING"] as const;

const BATTERY_DRAIN_PER_TICK = 0.15;
const BATTERY_MIN = 2;
const BATTERY_RECHARGE_PROBABILITY = 0.002;

type SimulatedShield = {
  id: number;
  ssmIotNumber: string;
  apiKey: string;
  battery: number;
  sensors: string[];
};

let activeShields: SimulatedShield[] = [];
const batteryLevels = new Map<number, number>();
const warnedUnsupportedShields = new Set<number>();

async function refreshShields() {
  try {
    const rows = await db
      .select({
        id: iotShields.id,
        ssmIotNumber: iotShields.ssmIotNumber,
        apiKey: iotShields.apiKey,
        battery: iotShields.battery,
        sensors: iotShieldSensors.sensorType,
      })
      .from(iotShields)
      .innerJoin(iotShieldSensors, eq(iotShields.id, iotShieldSensors.shieldId))
      .where(and(eq(iotShields.status, "ACTIVE"), eq(iotShieldSensors.status, "ACTIVE")));

    const shieldMap = new Map<number, SimulatedShield>();

    for (const row of rows) {
      if (!shieldMap.has(row.id)) {
        shieldMap.set(row.id, {
          id: row.id,
          ssmIotNumber: row.ssmIotNumber,
          apiKey: row.apiKey,
          battery: row.battery !== null ? parseFloat(row.battery) : 100,
          sensors: [],
        });
      }
      shieldMap.get(row.id)!.sensors.push(row.sensors);
    }

    const previousCount = activeShields.length;
    activeShields = Array.from(shieldMap.values());

    for (const shield of activeShields) {
      if (!batteryLevels.has(shield.id)) {
        batteryLevels.set(shield.id, shield.battery);
      }
    }

    if (activeShields.length !== previousCount) {
      console.log(
        `[simulateur] ${activeShields.length} bouclier(s) actif(s) détecté(s) en base.`
      );
    }
  } catch (error) {
    console.error("[simulateur] Erreur lors de la lecture des boucliers :", error);
  }
}

function randomBetween(min: number, max: number) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

function randomGpsOffset(min: number, max: number) {
  return +(Math.random() * (max - min) + min).toFixed(6);
}

function generateReading(sensors: string[]): Record<string, unknown> | null {
  const isAnomaly = Math.random() < 0.1;
  const measuredAt = new Date().toISOString();
  const payload: Record<string, unknown> = { measuredAt };

  if (sensors.includes("TEMPERATURE")) {
    payload.temperature = isAnomaly ? randomBetween(40.6, 41.0) : randomBetween(37.5, 39.5);
  }

  if (sensors.includes("ACTIVITY")) {
    payload.activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
  }

  if (sensors.includes("GPS")) {
    payload.latitude = 33.5731 + randomGpsOffset(-0.0005, 0.0005);
    payload.longitude = -7.5898 + randomGpsOffset(-0.0005, 0.0005);
  }

  if (Object.keys(payload).length <= 1) {
    return null;
  }

  return payload;
}

async function sendReading(shield: SimulatedShield) {
  const payload = generateReading(shield.sensors);

  if (!payload) {
    if (!warnedUnsupportedShields.has(shield.id)) {
      console.log(
        `[simulateur] ${shield.ssmIotNumber} : aucun capteur supporté, ignoré.`
      );
      warnedUnsupportedShields.add(shield.id);
    }
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": shield.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.log(`ERREUR [${shield.ssmIotNumber}]:`, await res.text());
    } else {
      const currentBattery = batteryLevels.get(shield.id) ?? shield.battery;
      const summary = Object.entries(payload)
        .filter(([key]) => key !== "measuredAt")
        .map(([key, value]) => `${key}=${value}`)
        .join(", ");
      console.log(
        `OK [${shield.ssmIotNumber}] (${shield.sensors.join("+")}) -> ${summary}, batterie ${currentBattery.toFixed(1)}%`
      );
    }
  } catch (error) {
    console.error(`[simulateur] Échec réseau pour ${shield.ssmIotNumber} :`, error);
  }
}

async function drainBatteries() {
  for (const shield of activeShields) {
    let level = batteryLevels.get(shield.id) ?? shield.battery;

    const isRecharge = Math.random() < BATTERY_RECHARGE_PROBABILITY;
    level = isRecharge
      ? 100
      : Math.max(BATTERY_MIN, level - BATTERY_DRAIN_PER_TICK);

    batteryLevels.set(shield.id, level);

    try {
      await db
        .update(iotShields)
        .set({ battery: level.toFixed(2), updatedAt: new Date() })
        .where(eq(iotShields.id, shield.id));
    } catch (error) {
      console.error(
        `[simulateur] Erreur mise à jour batterie pour ${shield.ssmIotNumber} :`,
        error
      );
    }
  }
}

async function main() {
  console.log(
    `Simulateur démarré — envoi toutes les ${SEND_INTERVAL_MS / 60000} min. Recherche des boucliers actifs...`
  );
  await refreshShields();

  if (activeShields.length === 0) {
    console.log(
      "[simulateur] Aucun bouclier ACTIVE trouvé pour le moment. " +
        "Le simulateur continue de vérifier toutes les 30s."
    );
  }

  setInterval(refreshShields, REFRESH_INTERVAL_MS);
  setInterval(async () => {
    await drainBatteries();
    activeShields.forEach(sendReading);
  }, SEND_INTERVAL_MS);
}

main();
