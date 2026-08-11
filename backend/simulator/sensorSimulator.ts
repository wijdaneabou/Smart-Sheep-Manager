import fetch from "node-fetch";
import { eq } from "drizzle-orm";
import { db } from "../src/db/connection.js";
import { iotShields } from "../src/db/schema/iotShields.js";

const API_URL = "http://localhost:3000/api/sensor-data";
const SEND_INTERVAL_MS = 3 * 60 * 1000; // fréquence d'envoi des mesures (3 min)
const REFRESH_INTERVAL_MS = 30_000; // fréquence de re-scan des boucliers en base

const ACTIVITIES = ["REST", "MOVEMENT", "GRAZING"] as const;

// Types de capteurs pris en charge par la table iot_sensor_data actuelle.
// FEEDING, WATER_INTAKE, HEART_RATE n'ont pas encore de colonnes dédiées —
// ces boucliers sont détectés mais aucune lecture n'est générée pour eux
// tant que le schéma n'est pas étendu.
const SUPPORTED_SENSOR_TYPES = ["LOCALIZATION", "TEMPERATURE", "ACTIVITY"] as const;

// ── Batterie simulée ────────────────────────────────────────────
const BATTERY_DRAIN_PER_TICK = 0.15; // % perdu à chaque envoi
const BATTERY_MIN = 2; // ne descend jamais en dessous (évite les valeurs négatives)
const BATTERY_RECHARGE_PROBABILITY = 0.002; // ~0.2% de chance par tick de "recharger" (remplacement de pile simulé)

type SimulatedShield = {
  id: number;
  ssmIotNumber: string;
  apiKey: string;
  battery: number;
  sensorType: string;
};

let activeShields: SimulatedShield[] = [];
const batteryLevels = new Map<number, number>();
// Pour ne logguer qu'une fois par bouclier non supporté, pas à chaque tick.
const warnedUnsupportedShields = new Set<number>();

/**
 * Interroge la base pour récupérer tous les boucliers ACTIFS avec leur clé
 * API, leur batterie actuelle et leur type de capteur. Appelée au démarrage
 * puis toutes les REFRESH_INTERVAL_MS — un bouclier créé/activé après le
 * lancement du simulateur est donc détecté automatiquement.
 */
async function refreshShields() {
  try {
    const rows = await db
      .select({
        id: iotShields.id,
        ssmIotNumber: iotShields.ssmIotNumber,
        apiKey: iotShields.apiKey,
        battery: iotShields.battery,
        sensorType: iotShields.sensorType,
      })
      .from(iotShields)
      .where(eq(iotShields.status, "ACTIVE"));

    const previousCount = activeShields.length;

    activeShields = rows.map((row) => {
      const battery = row.battery !== null ? parseFloat(row.battery) : 100;
      if (!batteryLevels.has(row.id)) {
        batteryLevels.set(row.id, battery);
      }
      return {
        id: row.id,
        ssmIotNumber: row.ssmIotNumber,
        apiKey: row.apiKey,
        battery,
        sensorType: row.sensorType,
      };
    });

    if (rows.length !== previousCount) {
      console.log(
        `[simulateur] ${rows.length} bouclier(s) actif(s) détecté(s) en base.`
      );
    }
  } catch (error) {
    console.error("[simulateur] Erreur lors de la lecture des boucliers :", error);
  }
}

function randomBetween(min: number, max: number) {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

// randomBetween arrondit à 2 décimales — trop grossier pour le petit
// décalage GPS (±0.0005), qui serait systématiquement écrasé à 0.00.
// On utilise donc 6 décimales pour les coordonnées.
function randomGpsOffset(min: number, max: number) {
  return +(Math.random() * (max - min) + min).toFixed(6);
}

/**
 * Génère une lecture adaptée au type réel du capteur — un bouclier
 * "Localisation GPS" ne renvoie pas de température, un bouclier
 * "Température" ne renvoie pas de position, etc. C'est plus réaliste
 * qu'un capteur qui mesurerait tout en même temps.
 */
function generateReading(sensorType: string): Record<string, unknown> | null {
  const isAnomaly = Math.random() < 0.1;
  const measuredAt = new Date().toISOString();

  switch (sensorType) {
    case "LOCALIZATION":
      // Le GPS/accéléromètre permet aussi de déduire l'activité (repos,
      // déplacement, pâturage), donc on l'inclut ici. Pas de température.
      return {
        activity: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
        latitude: 33.5731 + randomGpsOffset(-0.0005, 0.0005),
        longitude: -7.5898 + randomGpsOffset(-0.0005, 0.0005),
        measuredAt,
      };

    case "TEMPERATURE":
      return {
        temperature: isAnomaly ? randomBetween(40.6, 41.0) : randomBetween(37.5, 39.5),
        measuredAt,
      };

    case "ACTIVITY":
      return {
        activity: ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)],
        measuredAt,
      };

    default:
      // FEEDING, WATER_INTAKE, HEART_RATE : pas encore de colonnes dédiées
      // dans iot_sensor_data. Rien à envoyer pour l'instant.
      return null;
  }
}

async function sendReading(shield: SimulatedShield) {
  const payload = generateReading(shield.sensorType);

  if (!payload) {
    if (!warnedUnsupportedShields.has(shield.id)) {
      console.log(
        `[simulateur] ${shield.ssmIotNumber} : type "${shield.sensorType}" pas encore supporté par le simulateur, ignoré.`
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
        `OK [${shield.ssmIotNumber}] (${shield.sensorType}) -> ${summary}, batterie ${currentBattery.toFixed(1)}%`
      );
    }
  } catch (error) {
    console.error(`[simulateur] Échec réseau pour ${shield.ssmIotNumber} :`, error);
  }
}

/**
 * Fait décroître la batterie de chaque bouclier actif et écrit la nouvelle
 * valeur en base. Indépendant du type de capteur — tout bouclier a une
 * batterie, quel que soit ce qu'il mesure.
 */
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