import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { animalBcsRecords } from "../schema/animalBcsRecords.js";
import { sql } from "drizzle-orm";

type BcsInsert = typeof animalBcsRecords.$inferInsert;

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedAnimalBcsRecords() {
  try {
    console.log("🚀 Début de la création des enregistrements BCS...");

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
        const numRecords = randomInt(5, 8);
        const records: BcsInsert[] = [];

        let currentBcs = parseFloat(animal.bcs as string) || 3.0;

        const dates: Date[] = [];
        for (let i = 0; i < numRecords; i++) {
          dates.push(randomDate(startDate, now));
        }
        dates.sort((a, b) => a.getTime() - b.getTime());

        for (let i = 0; i < numRecords; i++) {
          const recordDate = dates[i];

          const delta = randomBetween(-0.5, 0.5);
          currentBcs = Math.min(5, Math.max(1, currentBcs + delta));
          currentBcs = Math.round(currentBcs * 10) / 10;

          const spinous = randomBetween(1, 5);
          const transverse = randomBetween(1, 5);
          const eye = randomBetween(1, 5);
          const fat = randomBetween(1, 5);
          const tail = randomBetween(1, 5);

          let recommendation = "Maintenir la ration";
          if (currentBcs < 2.5) recommendation = "Augmenter la ration";
          if (currentBcs > 4.0) recommendation = "Réduire la ration";

          records.push({
            animalId: animal.id,
            bcsScore: currentBcs.toFixed(1),
            spinousProcesses: spinous.toFixed(1),
            transverseProcesses: transverse.toFixed(1),
            eyeMuscle: eye.toFixed(1),
            fatCover: fat.toFixed(1),
            tailDock: tail.toFixed(1),
            date: recordDate,
            evaluator: "Vétérinaire IA",
            notes: `BCS évaluation ${i + 1}`,
            nutritionalRecommendation: recommendation,
          });
        }

        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          await tx.insert(animalBcsRecords).values(batch);
          totalRecords += batch.length;
        }

        if (idx % 1000 === 0) {
          console.log(`✅ ${idx} / ${allAnimals.length} animaux traités...`);
        }
      }
    });

    console.log(`✅ ${totalRecords} enregistrements BCS créés.`);

    const stats = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(animalBcsRecords);
    console.log(`📊 Total en base : ${stats[0]?.count || 0}`);

  } catch (err) {
    console.error("❌ Erreur :", err);
  }
  process.exit(0);
}

seedAnimalBcsRecords();