import "dotenv/config";
import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { animalBcsRecords } from "../schema/animalBcsRecords.js";

async function seedAnimalBcs() {
  try {
    const animalRows = await db.select().from(animals);
    if (animalRows.length === 0) {
      console.log("⚠️ Aucun animal trouvé dans la base de données pour la seed BCS.");
      return;
    }

    console.log(`🌱 Création de données d'évaluation BCS pour ${animalRows.length} animaux...`);

    const sampleBcsData = [
      {
        bcsScore: "3.5",
        spinousProcesses: "3.5",
        transverseProcesses: "3.5",
        eyeMuscle: "4.0",
        fatCover: "3.0",
        tailDock: "3.5",
        date: "2026-05-10",
        evaluator: "Dr. Martin (Vétérinaire)",
        notes: "Excellente musculature de longe, épine bien couverte.",
        nutritionalRecommendation: "Régime d'entretien optimal à poursuivre.",
      },
      {
        bcsScore: "3.0",
        spinousProcesses: "3.0",
        transverseProcesses: "3.0",
        eyeMuscle: "3.5",
        fatCover: "2.5",
        tailDock: "3.0",
        date: "2026-06-15",
        evaluator: "Dr. Martin (Vétérinaire)",
        notes: "Score équilibré. Légère diminution de la couche adipeuse.",
        nutritionalRecommendation: "Conserver la ration actuelle avec un supplément d'oligo-éléments.",
      },
      {
        bcsScore: "2.5",
        spinousProcesses: "2.0",
        transverseProcesses: "2.5",
        eyeMuscle: "2.5",
        fatCover: "2.0",
        tailDock: "3.0",
        date: "2026-07-01",
        evaluator: "Jean Dupont (Éleveur)",
        notes: "Apophyses sensibles au toucher. Perte de condition post-lactation.",
        nutritionalRecommendation: "Augmenter l'apport en concentrés énergétiques de 200g/jour.",
      },
      {
        bcsScore: "4.0",
        spinousProcesses: "4.0",
        transverseProcesses: "4.0",
        eyeMuscle: "4.5",
        fatCover: "4.0",
        tailDock: "3.5",
        date: "2026-07-20",
        evaluator: "Dr. Martin (Vétérinaire)",
        notes: "Animal très bien couvert, apophyses arrondies.",
        nutritionalRecommendation: "Limiter les glucides rapidement assimilables.",
      },
    ];

    let insertedCount = 0;
    for (let index = 0; index < animalRows.length; index++) {
      const animal = animalRows[index];
      const dataSample = sampleBcsData[index % sampleBcsData.length];

      await db.insert(animalBcsRecords).values({
        animalId: animal.id,
        bcsScore: dataSample.bcsScore,
        spinousProcesses: dataSample.spinousProcesses,
        transverseProcesses: dataSample.transverseProcesses,
        eyeMuscle: dataSample.eyeMuscle,
        fatCover: dataSample.fatCover,
        tailDock: dataSample.tailDock,
        date: dataSample.date as any,
        evaluator: dataSample.evaluator,
        notes: dataSample.notes,
        nutritionalRecommendation: dataSample.nutritionalRecommendation,
      });

      insertedCount++;
    }

    console.log(`✅ ${insertedCount} enregistrements BCS créés avec succès.`);
  } catch (error) {
    console.error("❌ Erreur lors du seeding BCS :", error);
  } finally {
    process.exit(0);
  }
}

seedAnimalBcs();
