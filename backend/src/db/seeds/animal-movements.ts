import "dotenv/config";
import { db } from "../connection.js";
import { animals } from "../schema/animals.js";
import { animalMovements } from "../schema/animalMovements.js";
import { eq } from "drizzle-orm";

/**
 * Seed data for animal movements (entries, exits, deaths, sales, purchases).
 * This provides test data for the US-3.3 "Mouvements du troupeau" feature.
 */
async function seedAnimalMovements() {
  try {
    // --- Find test animals ---
    const birka = await db
      .select()
      .from(animals)
      .where(eq(animals.rfid, "MA2026000001"));
    const atlas = await db
      .select()
      .from(animals)
      .where(eq(animals.rfid, "MA2026000002"));
    const luna = await db
      .select()
      .from(animals)
      .where(eq(animals.rfid, "MA2026000003"));

    if (birka.length === 0 || atlas.length === 0 || luna.length === 0) {
      console.log("⚠️  Animaux de test non trouvés. Exécutez d'abord : npm run seed:animal-history");
      process.exit(0);
      return;
    }

    const birkaId = birka[0].id;
    const atlasId = atlas[0].id;
    const lunaId = luna[0].id;

    const movements = [
      // ENTRY - Birka purchased
      {
        animalId: birkaId,
        type: "ENTRY" as const,
        date: "2024-03-15",
        reason: "Achat",
        sourceDestination: "Élever de Sardi, Taza",
        price: "1200.00",
      },
      // PURCHASE - Atlas purchased
      {
        animalId: atlasId,
        type: "PURCHASE" as const,
        date: "2023-11-20",
        reason: "Achat d'un mâle reproducteur",
        sourceDestination: "Élever de D'man, Fès",
        price: "2500.00",
      },
      // ENTRY - Luna purchased
      {
        animalId: lunaId,
        type: "ENTRY" as const,
        date: "2024-01-10",
        reason: "Achat",
        sourceDestination: "Élever de Timahdite, Meknès",
        price: "1100.00",
      },
      // BIRTH - Birka gave birth
      {
        animalId: birkaId,
        type: "ENTRY" as const,
        date: "2025-03-05",
        reason: "Mise-bas",
        sourceDestination: "Sur place",
        price: null,
      },
      // DEATH - Luna's lamb died
      {
        animalId: lunaId,
        type: "DEATH" as const,
        date: "2025-04-10",
        reason: "Décès d'un agneau (faiblesse à la naissance)",
        sourceDestination: "Sur place",
        price: null,
      },
      // SALE - Atlas sold
      {
        animalId: atlasId,
        type: "SALE" as const,
        date: "2025-05-01",
        reason: "Vente à un autre éleveur",
        sourceDestination: "Élever de D'man, Taza",
        price: "3200.00",
      },
      // EXIT - Birka sold
      {
        animalId: birkaId,
        type: "EXIT" as const,
        date: "2025-06-15",
        reason: "Vente",
        sourceDestination: "Marché aux moutons, Rabat",
        price: "1800.00",
      },
    ];

    for (const movement of movements) {
      await db.insert(animalMovements).values(movement as any);
    }

    console.log(`✅ ${movements.length} mouvements de troupeau créés.`);

    console.log("\n📊 Résumé de la seed :");
    const entryCount = movements.filter((m) => m.type === "ENTRY" || m.type === "PURCHASE").length;
    const exitCount = movements.filter((m) => m.type === "EXIT" || m.type === "SALE" || m.type === "DEATH").length;
    console.log(`   - ${entryCount} entrées (ENTRY/PURCHASE)`);
    console.log(`   - ${exitCount} sorties (EXIT/SALE/DEATH)`);
  } catch (error) {
    console.error("❌ Erreur lors de la seed :", error);
  } finally {
    process.exit(0);
  }
}

seedAnimalMovements();
