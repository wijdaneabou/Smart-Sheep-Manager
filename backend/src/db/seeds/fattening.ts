import "dotenv/config";
import { db } from "../connection.js";
import { exploitations } from "../schema/exploitations.js";
import { animals } from "../schema/animals.js";
import { fatteningBatches } from "../schema/fatteningBatches.js";
import { fatteningBatchWeightRecords } from "../schema/fatteningBatchWeightRecords.js";
import { fatteningFeedRecords } from "../schema/fatteningFeedRecords.js";
import { fatteningBatchCosts } from "../schema/fatteningBatchCosts.js";
import { fatteningBatchIndividualWeights } from "../schema/fatteningBatchIndividualWeights.js";
import { fatteningAlerts } from "../schema/fatteningAlerts.js";
import { eq } from "drizzle-orm";

async function seedFattening() {
  try {
    console.log("\n🌱 Seeding fattening module data...\n");

    let exploitationId: number;

    const existingExploitations = await db.select().from(exploitations);
    if (existingExploitations.length > 0) {
      exploitationId = existingExploitations[0].id;
      console.log(`ℹ️  Exploitation existante utilisée : ${existingExploitations[0].name} (ID: ${exploitationId})`);
    } else {
      const [exploitation] = await db.insert(exploitations).values({
        name: "Ferme Test Engraissement",
        superficie: "50.00",
        type: "OVIN",
        latitude: "34.020882",
        longitude: "-6.841650",
      }).$returningId();
      exploitationId = exploitation.id;
      console.log(`✅ Exploitation créée : Ferme Test Engraissement (ID: ${exploitationId})`);
    }

    const existingBatches = await db.select().from(fatteningBatches).where(eq(fatteningBatches.exploitationId, exploitationId));
    if (existingBatches.length > 0) {
      console.log("ℹ️  Des lots d'engraissement existent déjà pour cette exploitation.");
      return;
    }

    const [batch1] = await db.insert(fatteningBatches).values({
      name: "Lot engraissement Lot A - Sardi",
      startDate: new Date("2025-09-01"),
      animalCount: 30,
      initialAverageWeight: "35.00",
      targetWeight: "45.00",
      targetDailyGmq: "0.150",
      estimatedEndDate: new Date("2025-12-15"),
      status: "ACTIVE",
      exploitationId,
      notes: "Lot standard de engraissement Sardi",
    }).$returningId();

    const [batch2] = await db.insert(fatteningBatches).values({
      name: "Lot engraissement Lot B - Timahdite",
      startDate: new Date("2025-08-15"),
      animalCount: 25,
      initialAverageWeight: "32.00",
      targetWeight: "42.00",
      targetDailyGmq: "0.120",
      estimatedEndDate: new Date("2025-12-20"),
      status: "ACTIVE",
      exploitationId,
      notes: "Lot Timahdite pour test performances",
    }).$returningId();

    const [batch3] = await db.insert(fatteningBatches).values({
      name: "Lot engraissement Lot C - D'man",
      startDate: new Date("2025-03-01"),
      animalCount: 20,
      initialAverageWeight: "28.00",
      targetWeight: "40.00",
      targetDailyGmq: "0.180",
      estimatedEndDate: new Date("2025-08-30"),
      status: "COMPLETED",
      exploitationId,
      notes: "Lot terminé pour test historique",
    }).$returningId();

    console.log(`✅ 3 lots d'engraissement créés (IDs: ${batch1.id}, ${batch2.id}, ${batch3.id})`);

    const weightRecords = [
      { fatteningBatchId: batch1.id, averageWeight: "35.00", date: "2025-09-01", note: "Poids initial" },
      { fatteningBatchId: batch1.id, averageWeight: "36.20", date: "2025-09-15", note: "Progression normale" },
      { fatteningBatchId: batch1.id, averageWeight: "37.50", date: "2025-10-01", note: "Bon GMQ" },
      { fatteningBatchId: batch1.id, averageWeight: "39.00", date: "2025-10-20", note: "Approche de l'objectif" },
      { fatteningBatchId: batch1.id, averageWeight: "40.50", date: "2025-11-10", note: "Croissance stable" },
      { fatteningBatchId: batch2.id, averageWeight: "32.00", date: "2025-08-15", note: "Poids initial" },
      { fatteningBatchId: batch2.id, averageWeight: "33.10", date: "2025-09-01", note: "Croissance lente" },
      { fatteningBatchId: batch2.id, averageWeight: "34.00", date: "2025-09-20", note: "GMQ sous la cible" },
      { fatteningBatchId: batch3.id, averageWeight: "28.00", date: "2025-03-01", note: "Poids initial" },
      { fatteningBatchId: batch3.id, averageWeight: "31.50", date: "2025-04-01", note: "Excellente croissance" },
      { fatteningBatchId: batch3.id, averageWeight: "35.00", date: "2025-05-01", note: "Progression régulière" },
      { fatteningBatchId: batch3.id, averageWeight: "38.50", date: "2025-06-15", note: "Presque terminé" },
      { fatteningBatchId: batch3.id, averageWeight: "40.20", date: "2025-08-01", note: "Objectif atteint" },
    ];

    for (const record of weightRecords) {
      await db.insert(fatteningBatchWeightRecords).values(record as any);
    }
    console.log(`✅ ${weightRecords.length} enregistrements de poids moyens créés.`);

    const feedRecords = [
      { fatteningBatchId: batch1.id, date: "2025-09-01", feedType: "Aliment concentré engrais", quantityKg: "450.000", unitPrice: "0.850", totalCost: "382.50", note: "Achat mensuel" },
      { fatteningBatchId: batch1.id, date: "2025-09-15", feedType: "Aliment concentré engrais", quantityKg: "460.000", unitPrice: "0.850", totalCost: "391.00", note: "Achat mensuel" },
      { fatteningBatchId: batch1.id, date: "2025-10-01", feedType: "Aliment concentré engrais", quantityKg: "470.000", unitPrice: "0.870", totalCost: "408.90", note: "Achat mensuel" },
      { fatteningBatchId: batch1.id, date: "2025-10-20", feedType: "Foin de luzerne", quantityKg: "200.000", unitPrice: "0.300", totalCost: "60.00", note: "Complément fourrage" },
      { fatteningBatchId: batch2.id, date: "2025-08-15", feedType: "Aliment concentré engrais", quantityKg: "320.000", unitPrice: "0.850", totalCost: "272.00", note: "Achat mensuel" },
      { fatteningBatchId: batch2.id, date: "2025-09-01", feedType: "Aliment concentré engrais", quantityKg: "310.000", unitPrice: "0.850", totalCost: "263.50", note: "Achat mensuel" },
      { fatteningBatchId: batch2.id, date: "2025-09-20", feedType: "Aliment concentré engrais", quantityKg: "330.000", unitPrice: "0.870", totalCost: "287.10", note: "Achat mensuel" },
      { fatteningBatchId: batch3.id, date: "2025-03-01", feedType: "Aliment concentré engrais", quantityKg: "280.000", unitPrice: "0.820", totalCost: "229.60", note: "Achat mensuel" },
      { fatteningBatchId: batch3.id, date: "2025-04-01", feedType: "Aliment concentré engrais", quantityKg: "290.000", unitPrice: "0.820", totalCost: "237.80", note: "Achat mensuel" },
      { fatteningBatchId: batch3.id, date: "2025-05-01", feedType: "Aliment concentré engrais", quantityKg: "300.000", unitPrice: "0.840", totalCost: "252.00", note: "Achat mensuel" },
      { fatteningBatchId: batch3.id, date: "2025-06-15", feedType: "Aliment concentré engrais", quantityKg: "310.000", unitPrice: "0.840", totalCost: "260.40", note: "Achat mensuel" },
      { fatteningBatchId: batch3.id, date: "2025-08-01", feedType: "Aliment concentré engrais", quantityKg: "250.000", unitPrice: "0.860", totalCost: "215.00", note: "Dernier achat" },
    ];

    for (const record of feedRecords) {
      await db.insert(fatteningFeedRecords).values(record as any);
    }
    console.log(`✅ ${feedRecords.length} enregistrements d'alimentation créés.`);

    const costRecords = [
      { fatteningBatchId: batch1.id, category: "Vétérinaire", description: "Vaccination lot A", amount: "150.00", date: "2025-09-05" },
      { fatteningBatchId: batch1.id, category: "Transport", description: "Transport des animaux", amount: "200.00", date: "2025-09-01" },
      { fatteningBatchId: batch1.id, category: "Main d'œuvre", description: "Surveillance mensuelle", amount: "300.00", date: "2025-10-01" },
      { fatteningBatchId: batch2.id, category: "Vétérinaire", description: "Déparasitage lot B", amount: "120.00", date: "2025-08-20" },
      { fatteningBatchId: batch2.id, category: "Eau", description: "Abonnement eau", amount: "80.00", date: "2025-09-01" },
      { fatteningBatchId: batch2.id, category: "Main d'œuvre", description: "Surveillance mensuelle", amount: "280.00", date: "2025-09-20" },
      { fatteningBatchId: batch3.id, category: "Vétérinaire", description: "Visite vétérinaire lot C", amount: "180.00", date: "2025-03-10" },
      { fatteningBatchId: batch3.id, category: "Transport", description: "Transport final", amount: "250.00", date: "2025-08-20" },
      { fatteningBatchId: batch3.id, category: "Assurance", description: "Assurance bétail", amount: "100.00", date: "2025-06-01" },
      { fatteningBatchId: batch3.id, category: "Fourrage", description: "Achat foin supplémentaire", amount: "90.00", date: "2025-05-15" },
    ];

    for (const record of costRecords) {
      await db.insert(fatteningBatchCosts).values(record as any);
    }
    console.log(`✅ ${costRecords.length} enregistrements de coûts créés.`);

    const existingAnimals = await db.select().from(animals).limit(5);
    const animalIds = existingAnimals.map(a => a.id);

    const individualWeightRecords: any[] = [];
    if (animalIds.length > 0) {
      individualWeightRecords.push(
        { fatteningBatchId: batch1.id, animalId: animalIds[0], weight: "34.50", date: "2025-09-01", note: "Poids individuel initial" },
        { fatteningBatchId: batch1.id, animalId: animalIds[0], weight: "36.00", date: "2025-10-01", note: "Poids intermédiaire" },
        { fatteningBatchId: batch1.id, animalId: animalIds[0], weight: "38.20", date: "2025-11-01", note: "Bonne progression" },
        { fatteningBatchId: batch1.id, animalId: animalIds[1], weight: "35.80", date: "2025-09-01", note: "Poids initial" },
        { fatteningBatchId: batch1.id, animalId: animalIds[1], weight: "37.10", date: "2025-10-01", note: "Progression normale" },
        { fatteningBatchId: batch2.id, animalId: animalIds[2], weight: "31.50", date: "2025-08-15", note: "Poids initial" },
        { fatteningBatchId: batch2.id, animalId: animalIds[2], weight: "33.00", date: "2025-09-15", note: "Croissance lente" },
        { fatteningBatchId: batch3.id, animalId: animalIds[3], weight: "27.80", date: "2025-03-01", note: "Poids initial" },
        { fatteningBatchId: batch3.id, animalId: animalIds[3], weight: "31.00", date: "2025-04-15", note: "Excellente croissance" },
        { fatteningBatchId: batch3.id, animalId: animalIds[3], weight: "34.50", date: "2025-06-01", note: "Progression régulière" },
        { fatteningBatchId: batch3.id, animalId: animalIds[3], weight: "39.80", date: "2025-08-01", note: "Objectif atteint" },
      );
    }

    for (const record of individualWeightRecords) {
      await db.insert(fatteningBatchIndividualWeights).values(record as any);
    }
    console.log(`${individualWeightRecords.length > 0 ? `✅ ${individualWeightRecords.length} enregistrements de poids individuels créés.` : "ℹ️  Aucun animal en base, pas de poids individuels créés."}`);

    const alertRecords = [
      { fatteningBatchId: batch1.id, exploitationId, type: "LOW_GMQ", severity: "WARNING", message: "Le GMQ du lot A est en dessous de la cible de 0.150 kg/jour.", value: "0.132", threshold: "0.150", resolved: 0 },
      { fatteningBatchId: batch1.id, exploitationId, type: "WEIGHT_DEVIATION", severity: "CRITICAL", message: "Écart de poids important détecté sur le lot A.", value: "-3.2", threshold: "2.0", resolved: 0 },
      { fatteningBatchId: batch2.id, exploitationId, type: "LOW_GMQ", severity: "CRITICAL", message: "Le GMQ du lot B est très en dessous de la cible de 0.120 kg/jour.", value: "0.085", threshold: "0.120", resolved: 0 },
      { fatteningBatchId: batch3.id, exploitationId, type: "LOW_GMQ", severity: "WARNING", message: "GMQ légèrement en dessous de la cible sur le lot C.", value: "0.155", threshold: "0.180", resolved: 1, resolvedAt: new Date("2025-06-15") },
    ];

    for (const record of alertRecords) {
      await db.insert(fatteningAlerts).values(record as any);
    }
    console.log(`✅ ${alertRecords.length} alertes créées.`);

    console.log("\n📊 Résumé de la seed :");
    console.log(`   - 1 exploitation (ID: ${exploitationId})`);
    console.log("   - 3 lots d'engraissement");
    console.log(`   - ${weightRecords.length} enregistrements de poids moyens`);
    console.log(`   - ${feedRecords.length} enregistrements d'alimentation`);
    console.log(`   - ${costRecords.length} enregistrements de coûts`);
    console.log(`   - ${individualWeightRecords.length} enregistrements de poids individuels`);
    console.log(`   - ${alertRecords.length} alertes`);
    console.log("\n✅ Seed fattening terminée avec succès.\n");
  } catch (error) {
    console.error("❌ Erreur lors de la seed fattening :", error);
  } finally {
    process.exit(0);
  }
}

seedFattening();