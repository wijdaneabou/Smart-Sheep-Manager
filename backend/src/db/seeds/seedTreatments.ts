// backend/src/db/seeds/seedTreatments.ts
import { db } from "../connection.js";
import { healthRecords } from "../schema/healthRecords.js";
import { treatments } from "../schema/treatments.js";
import { users } from "../schema/users.js";
import { sql, eq, and, inArray } from "drizzle-orm";

type TreatmentInsert = typeof treatments.$inferInsert;

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
async function seedTreatments() {
  try {
    console.log("🚀 Début de la création des traitements (treatments)...");

    // 1. Récupérer les enregistrements santé non-HEALTHY
    const sickRecords = await db
      .select()
      .from(healthRecords)
      .where(sql`status != 'HEALTHY'`);

    console.log(`📊 ${sickRecords.length} enregistrements de santé non-HEALTHY trouvés.`);

    if (sickRecords.length === 0) {
      console.log("⚠️ Aucun enregistrement non-HEALTHY. Pas de traitements à créer.");
      return;
    }

    // 2. Récupérer les vétérinaires (pour administeredBy)
    const vets = await db.select().from(users).where(eq(users.roleId, 5));
    if (vets.length === 0) {
      console.log("❌ Aucun vétérinaire trouvé.");
      return;
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 3);

    let totalTreatments = 0;
    const BATCH_SIZE = 1000;

    await db.transaction(async (tx) => {
      for (let idx = 0; idx < sickRecords.length; idx++) {
        const healthRecord = sickRecords[idx];
        const vet = vets[idx % vets.length];

        const medicationNames = [
          "Amoxicilline 20%",
          "Ivermectine",
          "Oxytétracycline",
          "Sulfamides",
          "Vitamines AD3E",
          "Antiparasitaire",
          "Penicilline",
          "Streptomycine",
        ];
        const frequencies = ["ONCE_DAILY", "TWICE_DAILY", "THREE_TIMES_DAILY", "WEEKLY", "MONTHLY"];
        const routes = ["ORAL", "INTRAMUSCULAR", "INTRAVENOUS", "SUBCUTANEOUS", "TOPICAL"];

        const startDateTreat = randomDate(startDate, now);
        const duration = randomInt(3, 14);
        const endDate = new Date(startDateTreat);
        endDate.setDate(endDate.getDate() + duration);

        const treatment: TreatmentInsert = {
          healthRecordId: healthRecord.id,
          medicationName: randomChoice(medicationNames),
          dosage: `${randomInt(1, 10)} ml`,
          durationDays: duration,
          frequency: randomChoice(frequencies) as any,
          route: randomChoice(routes) as any,
          startDate: startDateTreat,
          endDate: endDate,
          nextDoseDate: new Date(startDateTreat.getTime() + 86400000 * randomInt(1, 3)),
          administered: Math.random() < 0.8,
          administeredBy: vet.id,
          notes: "Traitement prescrit suite au diagnostic",
        };

        await tx.insert(treatments).values(treatment);
        totalTreatments++;

        if (totalTreatments % BATCH_SIZE === 0) {
          console.log(`✅ ${totalTreatments} / ${sickRecords.length} traitements créés...`);
        }
      }
    });

    console.log(`✅ ${totalTreatments} traitements créés.`);

    // Statistiques
    const stats = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(treatments);
    console.log(`📊 Total des traitements en base : ${stats[0]?.count || 0}`);

  } catch (err) {
    console.error("❌ Erreur :", err);
  }
  process.exit(0);
}

seedTreatments();