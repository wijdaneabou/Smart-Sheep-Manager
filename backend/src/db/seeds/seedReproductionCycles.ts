import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { reproductionCycles } from "../schema/reproductionCycles.js";
import { users } from "../schema/users.js";
import { sql, eq, and } from "drizzle-orm";

type CycleInsert = typeof reproductionCycles.$inferInsert;

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
async function seedReproductionCycles() {
  try {
    console.log("🚀 Début de la création des cycles de reproduction...");

    // 1. Récupérer toutes les femelles
    const allFemales = await db
      .select()
      .from(animals)
      .where(sql`sex = 'FEMALE'`);

    console.log(`📊 ${allFemales.length} femelles trouvées.`);

    if (allFemales.length === 0) {
      console.log("❌ Aucune femelle. Exécute d'abord seedAnimals.");
      return;
    }

    // 2. Récupérer tous les mâles (pour maleId)
    const allMales = await db
      .select()
      .from(animals)
      .where(sql`sex = 'MALE'`);

    console.log(`📊 ${allMales.length} mâles trouvés.`);

    // 3. Récupérer les vétérinaires (pour createdBy)
    const vets = await db.select().from(users).where(eq(users.roleId, 5));
    console.log(`📊 ${vets.length} vétérinaires trouvés.`);

    // 4. Sélectionner 60% des femelles pour la reproduction
    const reproductrices = allFemales.filter(() => Math.random() < 0.6);
    console.log(`📊 ${reproductrices.length} femelles reproductrices (60%).`);

    if (reproductrices.length === 0) {
      console.log("❌ Aucune femelle reproductrice sélectionnée.");
      return;
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setFullYear(now.getFullYear() - 1); // 1 an en arrière

    let totalCycles = 0;
    let totalLambings = 0;
    const BATCH_SIZE = 5000;

    await db.transaction(async (tx) => {
      for (let idx = 0; idx < reproductrices.length; idx++) {
        const female = reproductrices[idx];

        // Sélectionner un mâle (de préférence de la même exploitation)
        let male = null;
        const malesSameExploitation = allMales.filter(
          (m) => m.exploitationId === female.exploitationId
        );
        if (malesSameExploitation.length > 0) {
          male = randomChoice(malesSameExploitation);
        } else if (allMales.length > 0) {
          male = randomChoice(allMales);
        }

        // Dates
        const heatDate = randomDate(startDate, now);
        const matingType = randomChoice(["natural", "ai"]) as "natural" | "ai";
        const isPregnant = Math.random() < 0.75; // 75% de gestation

        // Calculer la date de mise bas (150 jours après la chaleur)
        let expectedLambingDate = null;
        let lambingDate = null;
        let lambingType = null;
        let liveBorn = null;
        let stillBorn = null;

        if (isPregnant) {
          expectedLambingDate = new Date(heatDate);
          expectedLambingDate.setDate(expectedLambingDate.getDate() + 150);

          // 80% des gestations aboutissent à une mise bas
          if (Math.random() < 0.8) {
            lambingDate = new Date(expectedLambingDate);
            lambingDate.setDate(lambingDate.getDate() + randomInt(-5, 5));
            lambingType = randomChoice(["single", "multiple"]);
            if (lambingType === "single") {
              liveBorn = 1;
              stillBorn = 0;
            } else {
              liveBorn = randomInt(1, 3);
              stillBorn = Math.random() < 0.1 ? randomInt(0, 1) : 0;
            }
            totalLambings++;
          }
        }

        const cycle: CycleInsert = {
          animalId: female.id,
          heatDate: heatDate,
          matingType: matingType,
          maleId: male?.id || null,
          semenReference: matingType === "ai" ? `SEM-${String(randomInt(1000, 9999))}` : null,
          pregnancyConfirmed: isPregnant,
          confirmationDate: isPregnant 
            ? new Date(heatDate.getTime() + randomInt(25, 35) * 86400000) 
            : null,
          expectedLambingDate: expectedLambingDate,
          ultrasoundNotes: isPregnant ? "Échographie réalisée" : null,
          lambingDate: lambingDate,
          lambingType: lambingType as any,
          liveBorn: liveBorn,
          stillBorn: stillBorn,
          notes: `Cycle de reproduction ${idx + 1}`,
          createdBy: vets.length > 0 ? randomChoice(vets).id : null,
        };

        await tx.insert(reproductionCycles).values(cycle);
        totalCycles++;

        if (totalCycles % BATCH_SIZE === 0) {
          console.log(`✅ ${totalCycles} / ${reproductrices.length} cycles créés...`);
        }
      }
    });

    console.log(`✅ ${totalCycles} cycles de reproduction créés.`);
    console.log(`✅ ${totalLambings} mises bas enregistrées.`);

    // Statistiques
    const stats = await db
      .select({
        matingType: reproductionCycles.matingType,
        count: sql<number>`COUNT(*)`,
      })
      .from(reproductionCycles)
      .groupBy(reproductionCycles.matingType);

    console.log("📊 Répartition par type de saillie :");
    console.table(stats);

    const pregnancyStats = await db
      .select({
        pregnancyConfirmed: reproductionCycles.pregnancyConfirmed,
        count: sql<number>`COUNT(*)`,
      })
      .from(reproductionCycles)
      .groupBy(reproductionCycles.pregnancyConfirmed);

    console.log("📊 Gestations confirmées :");
    console.table(pregnancyStats);

  } catch (err) {
    console.error("❌ Erreur :", err);
  }
  process.exit(0);
}

seedReproductionCycles();