import "dotenv/config";
import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { animalHealthRecords } from "../schema/animalHealthRecords.js";
import { animalReproductionRecords } from "../schema/animalReproductionRecords.js";
import { animalWeightRecords } from "../schema/animalWeightRecords.js";
import { eq } from "drizzle-orm";

/**
 * Seed data for animals with health, reproduction, and weight history records.
 * This provides test data for the US-3.2 "Historique individuel" feature.
 */
async function seedAnimalHistory() {
  try {
    // --- Create test animals ---
    const testAnimals = [
      {
        rfid: "MA2026000001",
        name: "Birka",
        breed: "Sardi" as const,
        sex: "FEMALE" as const,
        birthDate: "2024-03-15",
        weight: "75.00",
        bcs: "3.5",
        healthStatus: "HEALTHY" as const,
      },
      {
        rfid: "MA2026000002",
        name: "Atlas",
        breed: "D'man" as const,
        sex: "MALE" as const,
        birthDate: "2023-11-20",
        weight: "95.00",
        bcs: "4.0",
        healthStatus: "HEALTHY" as const,
      },
      {
        rfid: "MA2026000003",
        name: "Luna",
        breed: "Timahdite" as const,
        sex: "FEMALE" as const,
        birthDate: "2024-01-10",
        weight: "70.00",
        bcs: "3.0",
        healthStatus: "RECOVERING" as const,
      },
    ];

    const animalIds: number[] = [];

    for (const animalData of testAnimals) {
      const existing = await db
        .select()
        .from(animals)
        .where(eq(animals.rfid, animalData.rfid));

      if (existing.length > 0) {
        console.log(`ℹ️  Animal ${animalData.name} (RFID: ${animalData.rfid}) existe déjà.`);
        animalIds.push(existing[0].id);
        continue;
      }

      const [result] = await db.insert(animals).values(animalData as any).$returningId();
      animalIds.push(result.id);
      console.log(`✅ Animal créé : ${animalData.name} (ID: ${result.id})`);
    }

    const [birkaId, atlasId, lunaId] = animalIds;

    // --- Health records for Birka (ID: birkaId) ---
    const birkaHealthRecords = [
      {
        animalId: birkaId,
        category: "HEALTH_CHECK" as const,
        title: "Contrôle de routine",
        description: "Examen complet, tout est normal.",
        veterinarian: "Dr. Martin",
        date: "2025-01-15",
        status: "COMPLETED" as const,
      },
      {
        animalId: birkaId,
        category: "VACCINATION" as const,
        title: "Vaccination anti-malignité",
        description: "Vaccin administré sans réaction.",
        veterinarian: "Dr. Martin",
        medication: "Malignité Vax",
        dosage: "2 ml",
        date: "2025-02-20",
        status: "COMPLETED" as const,
      },
      {
        animalId: birkaId,
        category: "TREATMENT" as const,
        title: "Traitement d'entérite",
        description: "Diarrhée légère, traitement antibiotique prescrit.",
        veterinarian: "Dr. Martin",
        medication: "Oxytéramycine",
        dosage: "5 mg/kg/jour",
        date: "2025-03-10",
        status: "RECOVERING" as const,
      },
      {
        animalId: birkaId,
        category: "HEALTH_CHECK" as const,
        title: "Contrôle post-traitement",
        description: "Récupération complète, diarrhée résolue.",
        veterinarian: "Dr. Martin",
        date: "2025-03-25",
        status: "COMPLETED" as const,
      },
    ];

    // --- Health records for Luna (ID: lunaId) ---
    const lunaHealthRecords = [
      {
        animalId: lunaId,
        category: "ILLNESS" as const,
        title: "Maux de ventre",
        description: "Luna présente des symptômes de malaise, perte d'appétit.",
        veterinarian: "Dr. Martin",
        date: "2025-04-05",
        status: "ONGOING" as const,
      },
      {
        animalId: lunaId,
        category: "TREATMENT" as const,
        title: "Antibiotique large spectre",
        description: "Traitement commencé pour infection bactérienne.",
        veterinarian: "Dr. Martin",
        medication: "Amoxicilline",
        dosage: "10 mg/kg/jour",
        date: "2025-04-06",
        status: "ONGOING" as const,
      },
    ];

    // --- Reproduction records ---
    const reproductionRecords = [
      {
        animalId: birkaId,
        eventType: "BREEDING" as const,
        date: "2024-06-01",
        partnerId: atlasId,
        result: "Saillie réussie",
        note: "Première saillie de Birka.",
      },
      {
        animalId: birkaId,
        eventType: "PREGNANCY_CHECK" as const,
        date: "2024-09-01",
        result: "Gestation confirmée",
        note: "Échographie réalisée, 1 agneau détecté.",
      },
      {
        animalId: birkaId,
        eventType: "BIRTH" as const,
        date: "2025-03-05",
        result: "1 agneau né (mâle)",
        note: "Accouchement naturel, agneau en bonne santé.",
      },
      {
        animalId: birkaId,
        eventType: "WEANING" as const,
        date: "2025-05-15",
        result: "Séparation à 72 jours",
        note: "L'agneau a bien pris du poids.",
      },
    ];

    // --- Weight records ---
    const weightRecords = [
      {
        animalId: birkaId,
        weight: "75.00",
        bcs: "3.5",
        date: "2025-01-15",
        note: "Poids stable.",
      },
      {
        animalId: birkaId,
        weight: "73.50",
        bcs: "3.0",
        date: "2025-03-10",
        note: "Perte de poids due à l'entérite.",
      },
      {
        animalId: birkaId,
        weight: "76.00",
        bcs: "3.5",
        date: "2025-03-25",
        note: "Récupération complète.",
      },
      {
        animalId: birkaId,
        weight: "78.00",
        bcs: "3.5",
        date: "2025-05-20",
        note: "Poids stable après mise-bas.",
      },
      {
        animalId: atlasId,
        weight: "95.00",
        bcs: "4.0",
        date: "2025-02-01",
        note: "Poids d'hiver.",
      },
      {
        animalId: atlasId,
        weight: "92.00",
        bcs: "3.5",
        date: "2025-04-15",
        note: "Perte légère de poids au printemps.",
      },
      {
        animalId: lunaId,
        weight: "70.00",
        bcs: "3.0",
        date: "2025-03-01",
        note: "Poids stable.",
      },
      {
        animalId: lunaId,
        weight: "68.50",
        bcs: "2.5",
        date: "2025-04-05",
        note: "Perte de poids due à la maladie.",
      },
    ];

    // Insert all records
    for (const record of [...birkaHealthRecords, ...lunaHealthRecords]) {
      await db.insert(animalHealthRecords).values(record as any);
    }
    console.log(`✅ ${birkaHealthRecords.length + lunaHealthRecords.length} enregistrements de santé créés.`);

    for (const record of reproductionRecords) {
      await db.insert(animalReproductionRecords).values(record as any);
    }
    console.log(`✅ ${reproductionRecords.length} enregistrements de reproduction créés.`);

    for (const record of weightRecords) {
      await db.insert(animalWeightRecords).values(record as any);
    }
    console.log(`✅ ${weightRecords.length} enregistrements de poids créés.`);

    console.log("\n📊 Résumé de la seed :");
    console.log(`   - ${testAnimals.length} animaux`);
    console.log(`   - ${birkaHealthRecords.length + lunaHealthRecords.length} enregistrements de santé/traitements`);
    console.log(`   - ${reproductionRecords.length} enregistrements de reproduction`);
    console.log(`   - ${weightRecords.length} enregistrements de poids`);
  } catch (error) {
    console.error("❌ Erreur lors de la seed :", error);
  } finally {
    process.exit(0);
  }
}

seedAnimalHistory();
