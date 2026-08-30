// backend/src/db/seeds/seedHealthRecords.ts
import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { healthRecords } from "../schema/healthRecords.js";
import { users } from "../schema/users.js";
import { sql, eq } from "drizzle-orm";

type HealthInsert = typeof healthRecords.$inferInsert;

// --- Utilitaires ---
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// --- Script principal ---
async function seedHealthRecords() {
  try {
    console.log("🚀 Début de la création des enregistrements de santé (health_records)...");

    // 1. Récupérer tous les animaux et les vétérinaires
    const allAnimals = await db.select().from(animals);
    const vets = await db.select().from(users).where(eq(users.roleId, 5)); // Vétérinaires

    console.log(`📊 ${allAnimals.length} animaux trouvés.`);
    console.log(`📊 ${vets.length} vétérinaires trouvés.`);

    if (allAnimals.length === 0 || vets.length === 0) {
      console.log("❌ Animaux ou vétérinaires manquants. Vérifie les seeds.");
      return;
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 6); // 6 mois d'historique

    let totalRecords = 0;
    const BATCH_SIZE = 1000;

    await db.transaction(async (tx) => {
      for (let idx = 0; idx < allAnimals.length; idx++) {
        const animal = allAnimals[idx];
        const vet = vets[idx % vets.length];

        // Statut aléatoire
        const statuses = ["HEALTHY", "HEALTHY", "HEALTHY", "SURVEILLANCE", "SICK", "UNDER_TREATMENT", "RECOVERED"];
        const status = randomChoice(statuses);
        const severity = status === "HEALTHY" ? "LOW" : randomChoice(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

        // Symptômes et diagnostic (seulement si non-HEALTHY)
        let symptoms = null;
        let diagnosis = null;
        if (status !== "HEALTHY") {
          const symptomList = ["Fièvre", "Toux", "Diarrhée", "Anorexie", "Boiterie", "Écoulement nasal", "Œdème"];
          const diagList = ["Pneumonie", "Mammite", "Parasitose", "Fasciolose", "Entérite", "Fièvre aphteuse"];
          symptoms = randomChoice(symptomList);
          diagnosis = randomChoice(diagList);
        }

        const record: HealthInsert = {
          animalId: animal.id,
          status: status as any,
          symptoms: symptoms,
          diagnosis: diagnosis,
          severity: severity as any,
          recordedBy: vet.id,
          createdAt: randomDate(startDate, now),
          updatedAt: new Date(),
        };

        await tx.insert(healthRecords).values(record);
        totalRecords++;

        if (totalRecords % BATCH_SIZE === 0) {
          console.log(`✅ ${totalRecords} / ${allAnimals.length} enregistrements créés...`);
        }
      }
    });

    console.log(`✅ ${totalRecords} enregistrements de santé créés.`);

    // Statistiques
    const stats = await db
      .select({
        status: healthRecords.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(healthRecords)
      .groupBy(healthRecords.status);

    console.log("📊 Répartition des statuts :");
    console.table(stats);

  } catch (err) {
    console.error("❌ Erreur :", err);
  }
  process.exit(0);
}

seedHealthRecords();