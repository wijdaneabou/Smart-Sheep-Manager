import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { animalWeightRecords } from "../schema/animalWeightRecords.js";
import { sql } from "drizzle-orm"; // ← Ajout important

type WeightInsert = typeof animalWeightRecords.$inferInsert;

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedAnimalWeightRecords() {
  try {
    console.log("🚀 Début de la création des enregistrements de poids...");

    const allAnimals = await db.select().from(animals);
    console.log(`📊 ${allAnimals.length} animaux trouvés.`);

    if (allAnimals.length === 0) {
      console.log("❌ Aucun animal. Exécute d'abord seedAnimals.");
      return;
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 12);

    let totalRecords = 0;
    const BATCH_SIZE = 5000;

    await db.transaction(async (tx) => {
      for (let idx = 0; idx < allAnimals.length; idx++) {
        const animal = allAnimals[idx];
        const numRecords = randomInt(10, 15);
        const records: WeightInsert[] = [];

        let currentWeight = parseFloat(animal.weight as string) || 35.0;

        const dates: Date[] = [];
        for (let i = 0; i < numRecords; i++) {
          dates.push(randomDate(startDate, now));
        }
        dates.sort((a, b) => a.getTime() - b.getTime());

        for (let i = 0; i < numRecords; i++) {
          const recordDate = dates[i];
          const daysDiff = Math.max(1, Math.floor((now.getTime() - recordDate.getTime()) / 86400000));
          const gain = randomBetween(0.15, 0.35) * daysDiff;
          const variation = randomBetween(-1.5, 2.0);
          currentWeight = Math.max(15, currentWeight + gain + variation);
          currentWeight = Math.round(currentWeight * 100) / 100;

          const bcs = Math.min(5, Math.max(1, randomBetween(2.0, 4.5)));

          records.push({
            animalId: animal.id,
            weight: currentWeight.toFixed(2),
            bcs: bcs.toFixed(1),
            date: recordDate,
            note: `Pesée ${i + 1}`,
          });
        }

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          await tx.insert(animalWeightRecords).values(batch);
          totalRecords += batch.length;
        }

        if (idx % 1000 === 0) {
          console.log(`✅ ${idx} / ${allAnimals.length} animaux traités...`);
        }
      }
    });

    console.log(`✅ ${totalRecords} enregistrements de poids créés.`);

    // ✅ Correction : utiliser sql importé
    const stats = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(animalWeightRecords);
    console.log(`📊 Total en base : ${stats[0]?.count || 0}`);

  } catch (err) {
    console.error("❌ Erreur :", err);
  }
  process.exit(0);
}

seedAnimalWeightRecords();