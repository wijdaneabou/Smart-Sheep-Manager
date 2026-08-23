import { execSync } from "child_process";

const seeds = [
  "src/db/seeds/roles.ts",
  "src/db/seeds/admin.ts",
  "src/db/seeds/permissions.ts",
  "src/db/seeds/role-permissions.ts",
  "src/db/seeds/userExploitations.ts",
  "src/db/seeds/fattening.ts",
  "src/db/seeds/feeding.ts",
  "src/db/seeds/finance.ts",
  "src/db/seeds/animal-history.ts",
  "src/db/seeds/animal-movements.ts",
  "src/db/seeds/animal-pedigree.ts",
  "src/db/seeds/seedReproductionCycles.ts",
  "src/db/seeds/commercial.ts",
];

async function seedAll() {
  console.log("\n🚀 Démarrage de la seed complète...\n");

  for (const seed of seeds) {
    console.log(`🌱 Exécution de ${seed}...`);
    try {
      execSync(`npx tsx ${seed}`, { stdio: "inherit" });
    } catch (error) {
      console.error(`❌ Erreur lors de l'exécution de ${seed}:`, error);
    }
  }

  console.log("\n🎉 Seed complète terminée.\n");
}

seedAll().catch((error) => {
  console.error("❌ Erreur lors de la seed complète :", error);
  process.exit(1);
});
