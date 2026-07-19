import { db } from "../connection.js";
import { permissions } from "../schema/permissions.js";

// All 16 modules from the spec
const MODULES = [
  "USERS",
  "EXPLOITATIONS",
  "HERD",
  "IOT",
  "HEALTH",
  "REPRODUCTION",
  "FEEDING",
  "FATTENING",
  "AI",
  "FINANCE",
  "COMMERCIAL",
  "BI_DASHBOARD",
  "COMMUNICATION",
  "REPORTING",
  "ADMIN",
  "AI_ASSISTANT",
];

const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE"];

async function seedPermissions() {
  try {
    let count = 0;
    for (const module of MODULES) {
      for (const action of ACTIONS) {
        const name = `${module}:${action}`;
        const description = `${action} sur le module ${module}`;
        await db
          .insert(permissions)
          .values({ name, description })
          .onDuplicateKeyUpdate({ set: { description } });
        count++;
      }
    }
    console.log(`✅ ${count} permissions insérées (ou déjà existantes).`);
  } catch (error) {
    console.error("Erreur :", error);
  }
  process.exit(0);
}

seedPermissions();