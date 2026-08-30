import { db } from "../connection.js";
import { roles } from "../schema/roles.js";

async function seedRoles() {
  try {
    const roleData = [
      { id: 1, name: "ADMIN", description: "Administrateur système - accès complet" },
      { id: 2, name: "MANAGER", description: "Gestionnaire d'exploitation" },
      { id: 3, name: "ELEVEUR", description: "Éleveur - propriétaire des animaux" },
      { id: 4, name: "OUVRIER", description: "Ouvrier agricole" },
      { id: 5, name: "VETERINAIRE", description: "Vétérinaire" },
      { id: 6, name: "COOPERATIVE", description: "Coopérative agricole" },
    ];

    for (const role of roleData) {
      await db.insert(roles).values(role).onDuplicateKeyUpdate({ set: role });
    }

    console.log(" Rôles créés/mis à jour avec succès.");
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

seedRoles();