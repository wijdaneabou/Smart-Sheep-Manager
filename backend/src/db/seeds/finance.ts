import "dotenv/config";
import { db } from "../connection.js";
import { exploitations } from "../schema/exploitations.js";
import { budgets } from "../schema/budgets.js";
import { expenses } from "../schema/expenses.js";
import { revenues } from "../schema/revenues.js";
import { eq } from "drizzle-orm";

async function seedFinance() {
  try {
    console.log("\n🌱 Seeding finance module data...\n");

    const existingExploitations = await db.select().from(exploitations);
    if (existingExploitations.length === 0) {
      console.log("⚠️ Aucune exploitation trouvée. Exécutez d'abord les seeds préalables.");
      return;
    }

    const exploitation = existingExploitations[0];
    const exploitationId = exploitation.id;
    console.log(`ℹ️  Exploitation utilisée : ${exploitation.name} (ID: ${exploitationId})`);

    const existingBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.exploitationId, exploitationId));
    if (existingBudgets.length > 0) {
      console.log("ℹ️  Des budgets existent déjà pour cette exploitation.");
    } else {
      const budgetData = [
        { year: 2025, month: 1, category: "ALIMENTATION", plannedAmount: "1200.00", actualAmount: "1150.00", notes: "Achat concentrés hiver" },
        { year: 2025, month: 2, category: "ALIMENTATION", plannedAmount: "1100.00", actualAmount: "1080.50", notes: "Achat concentrés printemps" },
        { year: 2025, month: 3, category: "ALIMENTATION", plannedAmount: "900.00", actualAmount: "920.00", notes: "Achat concentrés printemps" },
        { year: 2025, month: 1, category: "SANTE", plannedAmount: "500.00", actualAmount: "480.00", notes: "Vaccinations et traitements hiver" },
        { year: 2025, month: 4, category: "SANTE", plannedAmount: "300.00", actualAmount: "320.00", notes: "Déparasitage printanier" },
        { year: 2025, month: 1, category: "MAIN_DOEUVRE", plannedAmount: "2000.00", actualAmount: "1950.00", notes: "Salaires mensuels" },
        { year: 2025, month: 2, category: "MAIN_DOEUVRE", plannedAmount: "2000.00", actualAmount: "2000.00", notes: "Salaires mensuels" },
        { year: 2025, month: 3, category: "MAIN_DOEUVRE", plannedAmount: "2000.00", actualAmount: "2000.00", notes: "Salaires mensuels" },
        { year: 2025, month: 1, category: "EQUIPMENT", plannedAmount: "800.00", actualAmount: "750.00", notes: "Maintenance bâtiments" },
        { year: 2025, month: 5, category: "EQUIPMENT", plannedAmount: "1500.00", actualAmount: "1420.00", notes: "Achat nouveau traqueur" },
        { year: 2025, month: 1, category: "REPRODUCTION", plannedAmount: "600.00", actualAmount: "580.00", notes: "Frais de reproduction" },
        { year: 2025, month: 1, category: "IOT", plannedAmount: "400.00", actualAmount: "380.00", notes: "Maintenance capteurs" },
        { year: 2025, month: 1, category: "DIVERS", plannedAmount: "300.00", actualAmount: "290.00", notes: "Frais divers" },
        { year: 2025, month: 7, category: "DIVERS", plannedAmount: "350.00", actualAmount: "340.00", notes: "Frais saison estivale" },
      ];

      for (const budget of budgetData) {
        await db.insert(budgets).values({
          ...budget,
          exploitationId,
          createdBy: 1,
        } as any);
      }
      console.log(`✅ ${budgetData.length} budgets créés.`);
    }

    const existingExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.exploitationId, exploitationId));
    if (existingExpenses.length > 0) {
      console.log("ℹ️  Des dépenses existent déjà pour cette exploitation.");
    } else {
      const expenseRecords = [
        { date: "2026-07-01", amount: "450.00", category: "ALIMENTATION", beneficiary: "Becquerels S.A.", paymentMethod: "BANK_TRANSFER", justification: "https://storage.example.com/expense_justif_001.jpg", notes: "Achat concentré AXP 500kg" },
        { date: "2026-07-05", amount: "180.00", category: "SANTE", beneficiary: "Clinique Vétérinaire Ouest", paymentMethod: "CASH", notes: "Vaccination oxyorostral" },
        { date: "2026-07-08", amount: "200.00", category: "EQUIPMENT", beneficiary: "Ferreterie D'Armor", paymentMethod: "CARD", justification: "https://storage.example.com/expense_justif_003.jpg", notes: "Clôture électrique pour pâtur" },
        { date: "2026-07-10", amount: "80.00", category: "EQUIPMENT", beneficiary: "Électricité du Sud", paymentMethod: "BANK_TRANSFER", notes: "Facture électricité bâtiments" },
        { date: "2026-07-12", amount: "150.00", category: "REPRODUCTION", beneficiary: "Élevage du Soleil", paymentMethod: "CASH", notes: "Semence de reproduction" },
        { date: "2026-07-14", amount: "50.00", category: "IOT", beneficiary: "Tech Bovins SARL", paymentMethod: "CARD", justification: "https://storage.example.com/expense_justif_006.jpg", notes: "Remplacement capteur température" },
        { date: "2026-07-18", amount: "100.00", category: "DIVERS", beneficiary: "Transporteur Local", paymentMethod: "CASH", notes: "Transport fourrage" },
        { date: "2026-07-20", amount: "650.00", category: "ALIMENTATION", beneficiary: "Becquerels S.A.", paymentMethod: "BANK_TRANSFER", justification: "https://storage.example.com/expense_justif_008.jpg", notes: "Approvisionnement fourrage hiver" },
        { date: "2026-07-22", amount: "220.00", category: "SANTE", beneficiary: "Pharmacie Vétérinaire Centrale", paymentMethod: "CHECK", notes: "Traitement antiparasitaire collectif" },
        { date: "2026-07-25", amount: "120.00", category: "MAIN_DOEUVRE", beneficiary: "Coop Éleveurs", paymentMethod: "BANK_TRANSFER", notes: "Aide main-d'œuvre saisonnière" },
        { date: "2026-07-28", amount: "90.00", category: "EQUIPMENT", beneficiary: "Quincaillerie Rurale", paymentMethod: "CARD", notes: "Matériel de réparation clôture" },
        { date: "2026-07-30", amount: "300.00", category: "ALIMENTATION", beneficiary: "Becquerels S.A.", paymentMethod: "BANK_TRANSFER", justification: "https://storage.example.com/expense_justif_012.jpg", notes: "Approvisionnement complémentaire" },
        { date: "2026-08-02", amount: "75.00", category: "SANTE", beneficiary: "Clinique Vétérinaire Ouest", paymentMethod: "CASH", notes: "Consultation bétail" },
        { date: "2026-08-05", amount: "40.00", category: "IOT", beneficiary: "Tech Bovins SARL", paymentMethod: "CARD", notes: "Abonnement plateforme monitoring" },
        { date: "2026-08-10", amount: "110.00", category: "DIVERS", beneficiary: "Transporteur Local", paymentMethod: "CASH", notes: "Transport animaux à l'abattoir" },
      ];

      for (const expense of expenseRecords) {
        await db.insert(expenses).values({
          ...expense,
          date: new Date(expense.date),
          exploitationId,
          createdBy: 1,
        } as any);
      }
      console.log(`✅ ${expenseRecords.length} dépenses créées.`);
    }

    const existingRevenues = await db
      .select()
      .from(revenues)
      .where(eq(revenues.exploitationId, exploitationId));
    if (existingRevenues.length > 0) {
      console.log("ℹ️  Des revenus existent déjà pour cette exploitation.");
    } else {
      const revenueRecords = [
        { date: "2026-07-03", type: "LAMB_SALE", quantity: "12.00", unitPrice: "180.00", totalHT: "2160.00", totalTTC: "2376.00", buyer: "Boucherie des Cimes", paymentMethod: "BANK_TRANSFER", status: "COLLECTED", notes: "Vent de 12 agneaux mâle" },
        { date: "2026-07-08", type: "LAMB_SALE", quantity: "8.00", unitPrice: "170.00", totalHT: "1360.00", totalTTC: "1496.00", buyer: "Boucherie des Cimes", paymentMethod: "CASH", status: "COLLECTED", notes: "Vent de 8 agneaux femelle" },
        { date: "2026-07-12", type: "WOOL_SALE", quantity: "25.00", unitPrice: "12.00", totalHT: "300.00", totalTTC: "330.00", buyer: "Filature du Nord", paymentMethod: "BANK_TRANSFER", status: "PENDING", notes: "Laine mérinos qualité supérieure" },
        { date: "2026-07-15", type: "LAMB_SALE", quantity: "10.00", unitPrice: "165.00", totalHT: "1650.00", totalTTC: "1815.00", buyer: "Abattoir Régional", paymentMethod: "CASH", status: "COLLECTED", notes: "Lot d'agneaux de fin d'été" },
        { date: "2026-07-20", type: "BY_PRODUCT", quantity: "1.00", unitPrice: "450.00", totalHT: "450.00", totalTTC: "495.00", buyer: "Fromagerie Artisanale", paymentMethod: "CHECK", status: "COLLECTED", notes: "Vente de fromage frais" },
        { date: "2026-07-22", type: "LAMB_SALE", quantity: "15.00", unitPrice: "175.00", totalHT: "2625.00", totalTTC: "2887.50", buyer: "Boucherie des Cimes", paymentMethod: "BANK_TRANSFER", status: "PENDING", notes: "Pré-commande pour rentrée" },
        { date: "2026-07-28", type: "WOOL_SALE", quantity: "18.00", unitPrice: "11.50", totalHT: "207.00", totalTTC: "227.70", buyer: "Filature du Nord", paymentMethod: "BANK_TRANSFER", status: "COLLECTED", notes: "Laine supplémentaire récoltée" },
        { date: "2026-08-01", type: "OTHER", quantity: "1.00", unitPrice: "500.00", totalHT: "500.00", totalTTC: "550.00", buyer: "Coopérative des Éleveurs", paymentMethod: "BANK_TRANSFER", status: "COLLECTED", notes: "Subvention locale pour agriculture durable" },
        { date: "2026-08-05", type: "LAMB_SALE", quantity: "6.00", unitPrice: "172.00", totalHT: "1032.00", totalTTC: "1135.20", buyer: "Boucherie des Cimes", paymentMethod: "CASH", status: "COLLECTED", notes: "Vente agneaux de rentrée" },
        { date: "2026-08-10", type: "BY_PRODUCT", quantity: "2.00", unitPrice: "320.00", totalHT: "640.00", totalTTC: "704.00", buyer: "Fromagerie Artisanale", paymentMethod: "CHECK", status: "PENDING", notes: "Livraison seconde vague fromage" },
        { date: "2026-08-15", type: "LAMB_SALE", quantity: "9.00", unitPrice: "168.00", totalHT: "1512.00", totalTTC: "1663.20", buyer: "Abattoir Régional", paymentMethod: "BANK_TRANSFER", status: "COLLECTED", notes: "Dernière vente du cycle d'engraissement" },
        { date: "2026-08-18", type: "WOOL_SALE", quantity: "30.00", unitPrice: "12.50", totalHT: "375.00", totalTTC: "412.50", buyer: "Filature du Nord", paymentMethod: "CASH", status: "PENDING", notes: "Récolte finale de laine" },
      ];

      for (const revenue of revenueRecords) {
        await db.insert(revenues).values({
          ...revenue,
          date: new Date(revenue.date),
          exploitationId,
          createdBy: 1,
        } as any);
      }
      console.log(`✅ ${revenueRecords.length} revenus créés.`);
    }

    console.log("\n📊 Résumé de la seed finance :");
    console.log(`   - Exploitation : ${exploitation.name} (ID: ${exploitationId})`);
    const budgetCount = existingBudgets.length > 0 ? existingBudgets.length : 14;
    const expenseCount = existingExpenses.length > 0 ? existingExpenses.length : 15;
    const revenueCount = existingRevenues.length > 0 ? existingRevenues.length : 12;
    console.log(`   - ${budgetCount} budgets, ${expenseCount} dépenses, ${revenueCount} revenus`);
    console.log("\n✅ Seed finance terminée avec succès.\n");
  } catch (error) {
    console.error("❌ Erreur lors du seed finance :", error);
  } finally {
    process.exit(0);
  }
}

seedFinance();
