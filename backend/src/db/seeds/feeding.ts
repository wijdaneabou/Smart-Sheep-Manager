import "dotenv/config";
import { db } from "../connection.js";
import { exploitations } from "../schema/exploitations.js";
import { batiments } from "../schema/batiments.js";
import { feedItems, type NewFeedItem } from "../schema/feedItems.js";
import { feedRations, type NewFeedRation } from "../schema/feedRations.js";
import { feedRationItems } from "../schema/feedRationItems.js";
import { feedStocks } from "../schema/feedStocks.js";
import { feedDistributions } from "../schema/feedDistributions.js";
import { eq } from "drizzle-orm";

async function seedFeeding() {
  try {
    console.log("\n🌱 Seeding feeding module data...\n");

    let exploitationId: number;

    const existingExploitations = await db.select().from(exploitations);
    if (existingExploitations.length > 0) {
      exploitationId = existingExploitations[0].id;
      console.log(`ℹ️  Exploitation existante utilisée : ${existingExploitations[0].name} (ID: ${exploitationId})`);
    } else {
      const [exploitation] = await db.insert(exploitations).values({
        name: "Ferme Test Alimentation",
        superficie: "50.00",
        type: "OVIN",
        latitude: "34.020882",
        longitude: "-6.841650",
      }).$returningId();
      exploitationId = exploitation.id;
      console.log(`✅ Exploitation créée : Ferme Test Alimentation (ID: ${exploitationId})`);
    }

    const existingItems = await db.select().from(feedItems).where(eq(feedItems.exploitationId, exploitationId));
    if (existingItems.length > 0) {
      console.log("ℹ️  Des aliments existent déjà pour cette exploitation.");
      return;
    }

    const items = [
      { name: "Foin de luzerne", category: "FOURRAGE", unit: "KG", unitPrice: "3.50", currentStock: "5000.000", minStockThreshold: "1000.000", supplier: "Coopérative Agricole", description: "Foin de luzerne de qualité supérieure" },
      { name: "Foin d'avoine", category: "FOURRAGE", unit: "KG", unitPrice: "2.80", currentStock: "3000.000", minStockThreshold: "500.000", supplier: "Fournisseur Local", description: "Foin d'avoine pour ration hivernale" },
      { name: "Concentré agneaux engraissement", category: "CONCENTRE", unit: "KG", unitPrice: "5.20", currentStock: "2500.000", minStockThreshold: "500.000", supplier: "Provenderie Al Kabira", description: "Aliment concentré pour agneaux en phase d'engraissement" },
      { name: "Concentré brebis allaitantes", category: "CONCENTRE", unit: "KG", unitPrice: "4.80", currentStock: "1800.000", minStockThreshold: "400.000", supplier: "Provenderie Al Kabira", description: "Aliment concentré pour brebis en lactation" },
      { name: "Concentré béliers", category: "CONCENTRE", unit: "KG", unitPrice: "4.50", currentStock: "800.000", minStockThreshold: "200.000", supplier: "Provenderie Al Kabira", description: "Aliment concentré pour béliers reproducteurs" },
      { name: "Minéral D3", category: "MINERAL", unit: "KG", unitPrice: "12.00", currentStock: "150.000", minStockThreshold: "30.000", supplier: "VétPharma", description: "Complément minéral vitaminé" },
      { name: "Sel de cuisine", category: "MINERAL", unit: "KG", unitPrice: "1.50", currentStock: "200.000", minStockThreshold: "50.000", supplier: "Fournisseur Local", description: "Sel pour bloc à lécher" },
      { name: "Mélasse de canne à sucre", category: "COMPLEMENT", unit: "L", unitPrice: "2.20", currentStock: "1000.000", minStockThreshold: "200.000", supplier: "Industrie Sucrière", description: "Mélasse pour appétence et énergie" },
      { name: "Paille de blé", category: "FOURRAGE", unit: "KG", unitPrice: "1.20", currentStock: "4000.000", minStockThreshold: "800.000", supplier: "Agriculteur Local", description: "Paille de blé comme fourrage d'entretien" },
      { name: "Orge grain concassé", category: "CONCENTRE", unit: "KG", unitPrice: "3.80", currentStock: "2000.000", minStockThreshold: "400.000", supplier: "Coopérative Agricole", description: "Orge concassé pour énergie" },
    ];

    const insertedItems: { id: number }[] = [];
    for (const item of items) {
      const [inserted] = await db.insert(feedItems).values({
        ...item,
        exploitationId,
      } as NewFeedItem).$returningId();
      insertedItems.push({ id: inserted.id });
    }
    console.log(`✅ ${items.length} aliments créés.`);

    const itemsMap: Record<string, number> = {};
    insertedItems.forEach((item, index) => {
      itemsMap[items[index].name] = item.id;
    });

    const rations = [
      { name: "Ration agneaux engraissement", code: "RATIO-ENG-001", targetType: "AGNELAUX", targetWeightKg: "35.00", dailyRationPerAnimalKg: "1.500", costPerKg: "0.00", description: "Ration complète pour agneaux en engraissement de 30-45 kg" },
      { name: "Ration brebis allaitantes", code: "RATIO-LACT-001", targetType: "AGNELLES", targetWeightKg: "60.00", dailyRationPerAnimalKg: "2.000", costPerKg: "0.00", description: "Ration pour brebis en début de lactation" },
      { name: "Ration béliers reproducteurs", code: "RATIO-BEL-001", targetType: "BELIERS", targetWeightKg: "80.00", dailyRationPerAnimalKg: "1.800", costPerKg: "0.00", description: "Ration d'entretien pour béliers hors saison" },
      { name: "Ration agneaux sevrage", code: "RATIO-SEV-001", targetType: "AGNEAUX_SEVRAGE", targetWeightKg: "25.00", dailyRationPerAnimalKg: "1.200", costPerKg: "0.00", description: "Ration de transition pour agneaux sevrés" },
      { name: "Ration entretien adultes", code: "RATIO-ENTR-001", targetType: "TOUS", targetWeightKg: "50.00", dailyRationPerAnimalKg: "1.000", costPerKg: "0.00", description: "Ration d'entretien hivernale pour adultes" },
    ];

    const insertedRations: { id: number }[] = [];
    for (const ration of rations) {
      const [inserted] = await db.insert(feedRations).values({
        ...ration,
        exploitationId,
      } as NewFeedRation).$returningId();
      insertedRations.push({ id: inserted.id });
    }
    console.log(`✅ ${rations.length} rations créées.`);

    const rationsMap: Record<string, number> = {};
    insertedRations.forEach((ration, index) => {
      rationsMap[rations[index].name] = ration.id;
    });

    const rationItems = [
      { rationId: rationsMap["Ration agneaux engraissement"], feedItemId: itemsMap["Concentré agneaux engraissement"], percentage: "60.00", quantityKgPerTon: "600.000" },
      { rationId: rationsMap["Ration agneaux engraissement"], feedItemId: itemsMap["Foin de luzerne"], percentage: "25.00", quantityKgPerTon: "250.000" },
      { rationId: rationsMap["Ration agneaux engraissement"], feedItemId: itemsMap["Mélasse de canne à sucre"], percentage: "10.00", quantityKgPerTon: "100.000" },
      { rationId: rationsMap["Ration agneaux engraissement"], feedItemId: itemsMap["Minéral D3"], percentage: "5.00", quantityKgPerTon: "50.000" },
      { rationId: rationsMap["Ration brebis allaitantes"], feedItemId: itemsMap["Concentré brebis allaitantes"], percentage: "50.00", quantityKgPerTon: "500.000" },
      { rationId: rationsMap["Ration brebis allaitantes"], feedItemId: itemsMap["Foin de luzerne"], percentage: "35.00", quantityKgPerTon: "350.000" },
      { rationId: rationsMap["Ration brebis allaitantes"], feedItemId: itemsMap["Orge grain concassé"], percentage: "10.00", quantityKgPerTon: "100.000" },
      { rationId: rationsMap["Ration brebis allaitantes"], feedItemId: itemsMap["Minéral D3"], percentage: "5.00", quantityKgPerTon: "50.000" },
      { rationId: rationsMap["Ration béliers reproducteurs"], feedItemId: itemsMap["Concentré béliers"], percentage: "40.00", quantityKgPerTon: "400.000" },
      { rationId: rationsMap["Ration béliers reproducteurs"], feedItemId: itemsMap["Foin d'avoine"], percentage: "40.00", quantityKgPerTon: "400.000" },
      { rationId: rationsMap["Ration béliers reproducteurs"], feedItemId: itemsMap["Orge grain concassé"], percentage: "15.00", quantityKgPerTon: "150.000" },
      { rationId: rationsMap["Ration béliers reproducteurs"], feedItemId: itemsMap["Minéral D3"], percentage: "5.00", quantityKgPerTon: "50.000" },
      { rationId: rationsMap["Ration agneaux sevrage"], feedItemId: itemsMap["Concentré agneaux engraissement"], percentage: "45.00", quantityKgPerTon: "450.000" },
      { rationId: rationsMap["Ration agneaux sevrage"], feedItemId: itemsMap["Foin de luzerne"], percentage: "40.00", quantityKgPerTon: "400.000" },
      { rationId: rationsMap["Ration agneaux sevrage"], feedItemId: itemsMap["Mélasse de canne à sucre"], percentage: "10.00", quantityKgPerTon: "100.000" },
      { rationId: rationsMap["Ration agneaux sevrage"], feedItemId: itemsMap["Minéral D3"], percentage: "5.00", quantityKgPerTon: "50.000" },
      { rationId: rationsMap["Ration entretien adultes"], feedItemId: itemsMap["Paille de blé"], percentage: "60.00", quantityKgPerTon: "600.000" },
      { rationId: rationsMap["Ration entretien adultes"], feedItemId: itemsMap["Foin d'avoine"], percentage: "30.00", quantityKgPerTon: "300.000" },
      { rationId: rationsMap["Ration entretien adultes"], feedItemId: itemsMap["Sel de cuisine"], percentage: "5.00", quantityKgPerTon: "50.000" },
      { rationId: rationsMap["Ration entretien adultes"], feedItemId: itemsMap["Minéral D3"], percentage: "5.00", quantityKgPerTon: "50.000" },
    ];

    for (const rationItem of rationItems) {
      await db.insert(feedRationItems).values(rationItem);
    }
    console.log(`✅ ${rationItems.length} éléments de ration créés.`);

    const stockMovements = [
      { feedItemId: itemsMap["Foin de luzerne"], movementType: "IN", quantity: "5000.000", unitPriceAtTime: "3.50", movementDate: "2025-09-01", batchNumber: "LOT-LUZ-001", reference: "ACHAT-2025-001", notes: "Achat initial foin luzerne", recordedBy: 1 },
      { feedItemId: itemsMap["Foin d'avoine"], movementType: "IN", quantity: "3000.000", unitPriceAtTime: "2.80", movementDate: "2025-09-01", batchNumber: "LOT-AVO-001", reference: "ACHAT-2025-002", notes: "Achat initial foin avoine", recordedBy: 1 },
      { feedItemId: itemsMap["Concentré agneaux engraissement"], movementType: "IN", quantity: "2500.000", unitPriceAtTime: "5.20", movementDate: "2025-09-05", batchNumber: "LOT-CONC-001", reference: "ACHAT-2025-003", notes: "Achat concentré agneaux", recordedBy: 1 },
      { feedItemId: itemsMap["Concentré brebis allaitantes"], movementType: "IN", quantity: "1800.000", unitPriceAtTime: "4.80", movementDate: "2025-09-05", batchNumber: "LOT-CONC-002", reference: "ACHAT-2025-004", notes: "Achat concentré brebis", recordedBy: 1 },
      { feedItemId: itemsMap["Concentré béliers"], movementType: "IN", quantity: "800.000", unitPriceAtTime: "4.50", movementDate: "2025-09-10", batchNumber: "LOT-CONC-003", reference: "ACHAT-2025-005", notes: "Achat concentré béliers", recordedBy: 1 },
      { feedItemId: itemsMap["Minéral D3"], movementType: "IN", quantity: "150.000", unitPriceAtTime: "12.00", movementDate: "2025-09-10", batchNumber: "LOT-MIN-001", reference: "ACHAT-2025-006", notes: "Achat minéral D3", recordedBy: 1 },
      { feedItemId: itemsMap["Sel de cuisine"], movementType: "IN", quantity: "200.000", unitPriceAtTime: "1.50", movementDate: "2025-09-10", batchNumber: "LOT-SEL-001", reference: "ACHAT-2025-007", notes: "Achat sel", recordedBy: 1 },
      { feedItemId: itemsMap["Mélasse de canne à sucre"], movementType: "IN", quantity: "1000.000", unitPriceAtTime: "2.20", movementDate: "2025-09-15", batchNumber: "LOT-MEL-001", reference: "ACHAT-2025-008", notes: "Achat mélasse", recordedBy: 1 },
      { feedItemId: itemsMap["Paille de blé"], movementType: "IN", quantity: "4000.000", unitPriceAtTime: "1.20", movementDate: "2025-09-15", batchNumber: "LOT-PAIL-001", reference: "ACHAT-2025-009", notes: "Achat paille", recordedBy: 1 },
      { feedItemId: itemsMap["Orge grain concassé"], movementType: "IN", quantity: "2000.000", unitPriceAtTime: "3.80", movementDate: "2025-09-20", batchNumber: "LOT-ORG-001", reference: "ACHAT-2025-010", notes: "Achat orge concassé", recordedBy: 1 },
      { feedItemId: itemsMap["Foin de luzerne"], movementType: "OUT", quantity: "500.000", unitPriceAtTime: "3.50", movementDate: "2025-10-01", reference: "CONSO-2025-001", notes: "Consommation octobre lot A", recordedBy: 1 },
      { feedItemId: itemsMap["Concentré agneaux engraissement"], movementType: "OUT", quantity: "300.000", unitPriceAtTime: "5.20", movementDate: "2025-10-01", reference: "CONSO-2025-002", notes: "Consommation octobre lot A", recordedBy: 1 },
      { feedItemId: itemsMap["Foin de luzerne"], movementType: "OUT", quantity: "600.000", unitPriceAtTime: "3.50", movementDate: "2025-11-01", reference: "CONSO-2025-003", notes: "Consommation novembre lot A", recordedBy: 1 },
      { feedItemId: itemsMap["Concentré agneaux engraissement"], movementType: "OUT", quantity: "350.000", unitPriceAtTime: "5.20", movementDate: "2025-11-01", reference: "CONSO-2025-004", notes: "Consommation novembre lot A", recordedBy: 1 },
      { feedItemId: itemsMap["Paille de blé"], movementType: "OUT", quantity: "400.000", unitPriceAtTime: "1.20", movementDate: "2025-11-15", reference: "CONSO-2025-005", notes: "Consommation paille hiver", recordedBy: 1 },
      { feedItemId: itemsMap["Foin d'avoine"], movementType: "OUT", quantity: "450.000", unitPriceAtTime: "2.80", movementDate: "2025-12-01", reference: "CONSO-2025-006", notes: "Consommation décembre entretien", recordedBy: 1 },
      { feedItemId: itemsMap["Concentré brebis allaitantes"], movementType: "OUT", quantity: "250.000", unitPriceAtTime: "4.80", movementDate: "2025-12-01", reference: "CONSO-2025-007", notes: "Consommation décembre brebis", recordedBy: 1 },
      { feedItemId: itemsMap["Minéral D3"], movementType: "OUT", quantity: "20.000", unitPriceAtTime: "12.00", movementDate: "2025-12-15", reference: "CONSO-2025-008", notes: "Distribution minéraux", recordedBy: 1 },
    ];

    for (const movement of stockMovements) {
      await db.insert(feedStocks).values(movement as any);
    }
    console.log(`✅ ${stockMovements.length} mouvements de stock créés.`);

    const batimentsList = await db.select().from(batiments).where(eq(batiments.exploitationId, exploitationId)).limit(1);
    const batimentId = batimentsList.length > 0 ? batimentsList[0].id : null;

    const distributions = [
      { rationId: rationsMap["Ration agneaux engraissement"], targetType: "BATIMENT", batimentId, distributionDate: "2025-10-01", timeOfDay: "MORNING", quantityDistributedKg: "150.000", numberOfAnimals: 30, refusedQuantityKg: "5.000", weatherConditions: "BON", notes: "Distribution matin lot A", distributedBy: 1 },
      { rationId: rationsMap["Ration agneaux engraissement"], targetType: "BATIMENT", batimentId, distributionDate: "2025-10-01", timeOfDay: "EVENING", quantityDistributedKg: "75.000", numberOfAnimals: 30, refusedQuantityKg: "2.000", weatherConditions: "BON", notes: "Distribution soir lot A", distributedBy: 1 },
      { rationId: rationsMap["Ration brebis allaitantes"], targetType: "BATIMENT", batimentId, distributionDate: "2025-10-01", timeOfDay: "MORNING", quantityDistributedKg: "200.000", numberOfAnimals: 50, refusedQuantityKg: "8.000", weatherConditions: "BON", notes: "Distribution brebis matin", distributedBy: 1 },
      { rationId: rationsMap["Ration brebis allaitantes"], targetType: "BATIMENT", batimentId, distributionDate: "2025-10-01", timeOfDay: "EVENING", quantityDistributedKg: "100.000", numberOfAnimals: 50, refusedQuantityKg: "3.000", weatherConditions: "BON", notes: "Distribution brebis soir", distributedBy: 1 },
      { rationId: rationsMap["Ration béliers reproducteurs"], targetType: "BATIMENT", batimentId, distributionDate: "2025-10-02", timeOfDay: "MIDDAY", quantityDistributedKg: "90.000", numberOfAnimals: 10, refusedQuantityKg: "1.500", weatherConditions: "BON", notes: "Distribution béliers", distributedBy: 1 },
      { rationId: rationsMap["Ration agneaux sevrage"], targetType: "BATIMENT", batimentId, distributionDate: "2025-10-02", timeOfDay: "MORNING", quantityDistributedKg: "60.000", numberOfAnimals: 20, refusedQuantityKg: "2.000", weatherConditions: "BON", notes: "Distribution agneaux sevrés", distributedBy: 1 },
      { rationId: rationsMap["Ration entretien adultes"], targetType: "BATIMENT", batimentId, distributionDate: "2025-10-03", timeOfDay: "MORNING", quantityDistributedKg: "80.000", numberOfAnimals: 40, refusedQuantityKg: "4.000", weatherConditions: "SEC", notes: "Distribution entretien", distributedBy: 1 },
      { rationId: rationsMap["Ration agneaux engraissement"], targetType: "BATIMENT", batimentId, distributionDate: "2025-11-01", timeOfDay: "MORNING", quantityDistributedKg: "160.000", numberOfAnimals: 30, refusedQuantityKg: "3.000", weatherConditions: "HUMIDE", notes: "Distribution matin lot A", distributedBy: 1 },
      { rationId: rationsMap["Ration agneaux engraissement"], targetType: "BATIMENT", batimentId, distributionDate: "2025-11-01", timeOfDay: "EVENING", quantityDistributedKg: "80.000", numberOfAnimals: 30, refusedQuantityKg: "1.000", weatherConditions: "HUMIDE", notes: "Distribution soir lot A", distributedBy: 1 },
      { rationId: rationsMap["Ration brebis allaitantes"], targetType: "BATIMENT", batimentId, distributionDate: "2025-11-01", timeOfDay: "MORNING", quantityDistributedKg: "220.000", numberOfAnimals: 50, refusedQuantityKg: "6.000", weatherConditions: "BON", notes: "Distribution brebis matin", distributedBy: 1 },
      { rationId: rationsMap["Ration entretien adultes"], targetType: "BATIMENT", batimentId, distributionDate: "2025-12-01", timeOfDay: "MORNING", quantityDistributedKg: "100.000", numberOfAnimals: 40, refusedQuantityKg: "5.000", weatherConditions: "FROID", notes: "Distribution hiver", distributedBy: 1 },
      { rationId: rationsMap["Ration agneaux engraissement"], targetType: "BATIMENT", batimentId, distributionDate: "2025-12-01", timeOfDay: "MORNING", quantityDistributedKg: "170.000", numberOfAnimals: 30, refusedQuantityKg: "2.000", weatherConditions: "FROID", notes: "Distribution décembre lot A", distributedBy: 1 },
      { rationId: rationsMap["Ration agneaux engraissement"], targetType: "BATIMENT", batimentId, distributionDate: "2025-12-01", timeOfDay: "EVENING", quantityDistributedKg: "85.000", numberOfAnimals: 30, refusedQuantityKg: "1.500", weatherConditions: "FROID", notes: "Distribution décembre soir lot A", distributedBy: 1 },
    ];

    for (const distribution of distributions) {
      await db.insert(feedDistributions).values(distribution as any);
    }
    console.log(`✅ ${distributions.length} distributions créées.`);

    console.log("\n📊 Résumé de la seed alimentation :");
    console.log(`   - 1 exploitation (ID: ${exploitationId})`);
    console.log(`   - ${items.length} aliments`);
    console.log(`   - ${rations.length} rations`);
    console.log(`   - ${rationItems.length} éléments de ration`);
    console.log(`   - ${stockMovements.length} mouvements de stock`);
    console.log(`   - ${distributions.length} distributions`);
    console.log("\n✅ Seed alimentation terminée avec succès.\n");
  } catch (error) {
    console.error("❌ Erreur lors de la seed alimentation :", error);
  } finally {
    process.exit(0);
  }
}

seedFeeding();
