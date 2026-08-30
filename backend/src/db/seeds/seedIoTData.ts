import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { exploitations } from "../schema/exploitations.js";
import { iotShields } from "../schema/iotShields.js";
import { iotSensorData } from "../schema/iotSensorData.js";
import { iotAlerts } from "../schema/iotAlerts.js";
import { sql } from "drizzle-orm";

// ─── Types ───────────────────────────────────────────────
type ShieldInsert = typeof iotShields.$inferInsert;
type SensorInsert = typeof iotSensorData.$inferInsert;
type AlertInsert = typeof iotAlerts.$inferInsert;

// ─── Paramètres configurables ───────────────────────────
const SHIELD_PERCENTAGE = 0.10;       // 10% des animaux équipés
const DAYS = 30;                     // Nombre de jours de données
const RECORDS_PER_DAY = 24;          // 1 enregistrement par heure

// ─── Utilitaires ──────────────────────────────────────────
function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function padNumber(n: number, length: number): string {
  return String(n).padStart(length, "0");
}

// ─── Script principal ────────────────────────────────────
async function seedIoTData() {
  try {
    console.log("🚀 Début de la création des données IoT...");

    // 1. Récupérer les animaux
    const allAnimals = await db.select().from(animals);
    console.log(`📊 ${allAnimals.length} animaux disponibles.`);

    // Sélection aléatoire des animaux équipés (10%)
    const selectedAnimals = allAnimals.filter(() => Math.random() < SHIELD_PERCENTAGE);
    console.log(`📊 ${selectedAnimals.length} animaux sélectionnés pour l'IoT.`);

    if (selectedAnimals.length === 0) {
      console.log("❌ Aucun animal sélectionné. Ajustez SHIELD_PERCENTAGE.");
      return;
    }

    // 2. Récupérer les exploitations
    const allExploitations = await db.select().from(exploitations);
    const exploitationMap = new Map(allExploitations.map(e => [e.id, e]));

    let shieldCount = 0;
    let sensorCount = 0;
    let alertCount = 0;

    const BATCH_SIZE = 1000;

    await db.transaction(async (tx) => {
      for (let idx = 0; idx < selectedAnimals.length; idx++) {
        const animal = selectedAnimals[idx];
        const exploitation = exploitationMap.get(animal.exploitationId!);

        // 2.1 Créer un shield
        const shieldNumber = padNumber(idx + 1, 6);
        const shield: ShieldInsert = {
          ssmIotNumber: `SSM-IOT-${shieldNumber}`,
          apiKey: `KEY-${padNumber(idx + 1, 8)}`,
          sensorType: randomChoice(["TEMPERATURE", "ACTIVITY", "HEART_RATE"]),
          battery: randomBetween(20, 100).toFixed(2),
          status: Math.random() < 0.95 ? "ACTIVE" : "INACTIVE",
          animalId: animal.id,
          exploitationId: exploitation?.id || null,
        };

        await tx.insert(iotShields).values(shield);
        shieldCount++;

        // Récupérer l'ID du shield
        const insertedShield = await tx
          .select()
          .from(iotShields)
          .where(sql`api_key = ${shield.apiKey}`)
          .limit(1);

        if (insertedShield.length === 0) continue;
        const shieldId = insertedShield[0].id;

        // 2.2 Générer les données capteurs
        const sensorBatch: SensorInsert[] = [];
        const alertBatch: AlertInsert[] = [];

        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - DAYS);

        // Température de base pour l'animal
        let baseTemp = randomBetween(38.0, 39.5);

        for (let day = 0; day < DAYS; day++) {
          // Ajouter une variation saisonnière sur la température de base
          const dayOffset = (day / DAYS) * 0.5;
          const seasonalTemp = baseTemp + dayOffset;

          for (let hour = 0; hour < RECORDS_PER_DAY; hour++) {
            const timestamp = new Date(startDate);
            timestamp.setDate(startDate.getDate() + day);
            timestamp.setHours(hour, 0, 0, 0);

            // Variation horaire (température plus élevée le jour, plus basse la nuit)
            const hourVariation = hour >= 8 && hour <= 18 
              ? randomBetween(0.2, 0.8) 
              : randomBetween(-0.8, -0.2);
            
            const temperature = Math.round((seasonalTemp + hourVariation + randomBetween(-0.3, 0.3)) * 100) / 100;

            // Activité (plus d'activité le jour)
            let activity: "REST" | "MOVEMENT" | "GRAZING";
            if (hour >= 6 && hour <= 10) {
              activity = randomChoice(["REST", "MOVEMENT", "GRAZING"]);
            } else if (hour >= 10 && hour <= 18) {
              activity = randomChoice(["MOVEMENT", "GRAZING", "GRAZING"]);
            } else {
              activity = "REST";
            }

            // Coordonnées GPS (petite variation autour de la position de l'exploitation)
            const baseLat = exploitation?.latitude ? parseFloat(exploitation.latitude as string) : 32.0;
            const baseLng = exploitation?.longitude ? parseFloat(exploitation.longitude as string) : -6.0;
            const lat = baseLat + randomBetween(-0.001, 0.001);
            const lng = baseLng + randomBetween(-0.001, 0.001);

            sensorBatch.push({
              shieldId: shieldId,
              temperature: temperature.toFixed(2),
              activity: activity,
              latitude: lat.toFixed(8),
              longitude: lng.toFixed(8),
              measuredAt: timestamp,
            });

            // ─── 2.3 Générer des alertes ──────────────────────────

            // Alerte température haute (> 40.5°C)
            if (temperature > 40.5 && Math.random() < 0.03) {
              alertBatch.push({
                shieldId: shieldId,
                animalId: animal.id,
                exploitationId: exploitation?.id || null,
                type: "HIGH_TEMPERATURE",
                severity: "CRITICAL",
                message: `Température élevée : ${temperature.toFixed(1)}°C`,
                value: temperature.toFixed(1),
                threshold: "40.5",
                resolved: Math.random() < 0.3 ? 1 : 0, // ✅ nombre 0 ou 1
                resolvedAt: Math.random() < 0.3 ? new Date(timestamp.getTime() + 3600000) : null,
                createdAt: timestamp,
              });
            }

            // Alerte inactivité (> 4h sans mouvement)
            if (activity === "REST" && hour >= 6 && hour <= 20 && Math.random() < 0.02) {
              alertBatch.push({
                shieldId: shieldId,
                animalId: animal.id,
                exploitationId: exploitation?.id || null,
                type: "INACTIVITY",
                severity: "WARNING",
                message: `Inactivité prolongée détectée`,
                value: "REST",
                threshold: "MOVEMENT",
                resolved: Math.random() < 0.5 ? 1 : 0,
                resolvedAt: Math.random() < 0.5 ? new Date(timestamp.getTime() + 7200000) : null,
                createdAt: timestamp,
              });
            }

            // Alerte batterie faible (< 15%)
            const batteryLevel = parseFloat(insertedShield[0].battery);
            if (batteryLevel < 15 && Math.random() < 0.02) {
              alertBatch.push({
                shieldId: shieldId,
                animalId: animal.id,
                exploitationId: exploitation?.id || null,
                type: "LOW_BATTERY",
                severity: "WARNING",
                message: `Batterie faible : ${batteryLevel.toFixed(0)}%`,
                value: batteryLevel.toFixed(0),
                threshold: "15",
                resolved: 0, // ✅ nombre
                resolvedAt: null,
                createdAt: timestamp,
              });
            }
          }
        }

        // Insérer les données capteurs par lots
        for (let i = 0; i < sensorBatch.length; i += BATCH_SIZE) {
          const chunk = sensorBatch.slice(i, i + BATCH_SIZE);
          await tx.insert(iotSensorData).values(chunk);
          sensorCount += chunk.length;
        }

        // Insérer les alertes
        if (alertBatch.length > 0) {
          await tx.insert(iotAlerts).values(alertBatch);
          alertCount += alertBatch.length;
        }

        // Progression
        if ((idx + 1) % 100 === 0 || idx + 1 === selectedAnimals.length) {
          console.log(
            `✅ ${idx + 1}/${selectedAnimals.length} shields traités ` +
            `(${shieldCount} shields, ${sensorCount} capteurs, ${alertCount} alertes)`
          );
        }
      }
    });

    // ─── Bilan ──────────────────────────────────────────────
    console.log(`✅ ${shieldCount} boucliers IoT créés.`);
    console.log(`✅ ${sensorCount} enregistrements de capteurs créés.`);
    console.log(`✅ ${alertCount} alertes générées.`);

    // Statistiques par type d'alerte
    const alertStats = await db
      .select({
        type: iotAlerts.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(iotAlerts)
      .groupBy(iotAlerts.type);

    console.log("📊 Répartition des alertes par type :");
    console.table(alertStats);

  } catch (err) {
    console.error("❌ Erreur :", err);
  }
  process.exit(0);
}

seedIoTData();