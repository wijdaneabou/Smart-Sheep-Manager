import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { exploitations } from "../schema/exploitations.js";
import { sql } from "drizzle-orm";

// Type exact attendu par Drizzle pour l'insertion
type AnimalInsert = typeof animals.$inferInsert;

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getBreedForIndex(index: number): "Sardi" | "Timahdite" | "D'man" | "Beni-Guil" {
  if (index < 50) return "Sardi";
  if (index < 100) return "Timahdite";
  if (index < 150) return "D'man";
  return "Beni-Guil";
}

function generateRFID(counter: number): string {
  return `MA2026${String(counter).padStart(8, "0")}`;
}

function getRandomBirthDate(): Date {
  const year = randomInt(2024, 2026);
  const month = randomInt(0, 11);
  const day = randomInt(1, 28);
  return new Date(year, month, day);
}

async function seedAnimals() {
  try {
    console.log("🚀 Création de 200 animaux par exploitation...");

    const allExploitations = await db.select().from(exploitations);
    console.log(`📊 ${allExploitations.length} exploitations trouvées.`);

    if (allExploitations.length === 0) {
      console.log("❌ Aucune exploitation. Exécute d'abord seedExploitations.");
      return;
    }

    const ANIMALS_PER_EXPLOITATION = 200;
    const TOTAL = allExploitations.length * ANIMALS_PER_EXPLOITATION;
    console.log(`📊 Objectif : ${TOTAL} animaux.`);

    let rfidCounter = 1;
    let created = 0;

    await db.transaction(async (tx) => {
      for (const exploitation of allExploitations) {
        const batch: AnimalInsert[] = [];

        for (let i = 0; i < ANIMALS_PER_EXPLOITATION; i++) {
          const breed = getBreedForIndex(i % 200);
          const sex = Math.random() > 0.4 ? "FEMALE" : "MALE";
          const birthDate = getRandomBirthDate();
          const initialWeight = sex === "FEMALE" 
            ? randomBetween(25, 45) 
            : randomBetween(30, 55);
          const bcs = randomBetween(2.0, 4.0);
          
          const currentRfid = generateRFID(rfidCounter);
          rfidCounter++;

          const animal: AnimalInsert = {
            rfid: currentRfid,
            name: `${breed}_${sex.toLowerCase()}_exp${exploitation.id}_${i + 1}`,
            breed: breed,
            sex: sex,
            birthDate: birthDate,
            // ✅ Conversion en string avec la bonne précision
            weight: initialWeight.toFixed(2),  // decimal(6,2) → "25.50"
            bcs: bcs.toFixed(1),               // decimal(3,1) → "3.5"
            healthStatus: "HEALTHY",
            fatherId: null,
            motherId: null,
            exploitationId: exploitation.id,
            photoUrl: null,
          };
          batch.push(animal);
        }

        await tx.insert(animals).values(batch);
        created += batch.length;

        if (created % 10000 === 0 || created === TOTAL) {
          console.log(`✅ ${created} / ${TOTAL} animaux créés...`);
        }
      }
    });

    console.log(`✅ ${created} animaux créés avec succès.`);

    // Statistiques via Drizzle
    const stats = await db
      .select({
        breed: animals.breed,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(animals)
      .groupBy(animals.breed);

    console.log("📊 Répartition par race :");
    console.table(stats);

  } catch (err) {
    console.error("❌ Erreur :", err);
  }

  process.exit(0);
}

seedAnimals();