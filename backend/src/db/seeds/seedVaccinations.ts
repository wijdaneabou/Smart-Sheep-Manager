import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { vaccinations } from "../schema/vaccinations.js";
import { users } from "../schema/users.js";
import { sql, eq } from "drizzle-orm";

type VaccinationInsert = typeof vaccinations.$inferInsert;

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
async function seedVaccinations() {
  try {
    console.log("🚀 Début de la création des vaccinations...");

    // 1. Récupérer tous les animaux
    const allAnimals = await db.select().from(animals);
    console.log(`📊 ${allAnimals.length} animaux trouvés.`);

    if (allAnimals.length === 0) {
      console.log("❌ Aucun animal. Exécute d'abord seedAnimals.");
      return;
    }

    // 2. Récupérer les vétérinaires (pour administeredBy)
    const vets = await db.select().from(users).where(eq(users.roleId, 5));
    console.log(`📊 ${vets.length} vétérinaires trouvés.`);

    if (vets.length === 0) {
      console.log("⚠️ Aucun vétérinaire. Les vaccinations seront sans administerBy.");
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1); // 1 an en arrière

    const vaccineTypes = [
      "PPR (Peste des Petits Ruminants)",
      "Clavelée",
      "Fièvre aphteuse",
      "Enterotoxémie",
      "Rage",
      "Charbon symptomatique",
      "Pasteurellose",
    ];

    let totalRecords = 0;
    const BATCH_SIZE = 5000;

    await db.transaction(async (tx) => {
      for (let idx = 0; idx < allAnimals.length; idx++) {
        const animal = allAnimals[idx];
        const numVaccines = randomInt(2, 3); // 2 à 3 vaccins par animal
        const records: VaccinationInsert[] = [];

        for (let i = 0; i < numVaccines; i++) {
          const vaccineDate = randomDate(startDate, now);
          const statuses = ["DONE", "DONE", "DONE", "PENDING", "OVERDUE"];
          const status = randomChoice(statuses) as any;
          const boosterDate = status === "DONE" 
            ? new Date(vaccineDate.getTime() + randomInt(30, 120) * 86400000) 
            : null;

          records.push({
            animalId: animal.id,
            vaccineType: randomChoice(vaccineTypes),
            batchNumber: `BATCH-${String(randomInt(1000, 9999))}`,
            date: vaccineDate,
            boosterDate: boosterDate,
            status: status,
            administeredBy: vets.length > 0 ? randomChoice(vets).id : null,
            notes: `Vaccination ${i + 1}`,
          });
        }

        // Insertion par lots
        for (let i = 0; i < records.length; i += BATCH_SIZE) {
          const batch = records.slice(i, i + BATCH_SIZE);
          await tx.insert(vaccinations).values(batch);
          totalRecords += batch.length;
        }

        if (idx % 1000 === 0) {
          console.log(`✅ ${idx} / ${allAnimals.length} animaux traités...`);
        }
      }
    });

    console.log(`✅ ${totalRecords} vaccinations créées.`);

    // Statistiques
    const stats = await db
      .select({
        status: vaccinations.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(vaccinations)
      .groupBy(vaccinations.status);

    console.log("📊 Répartition des statuts :");
    console.table(stats);

  } catch (err) {
    console.error("❌ Erreur :", err);
  }
  process.exit(0);
}

seedVaccinations();