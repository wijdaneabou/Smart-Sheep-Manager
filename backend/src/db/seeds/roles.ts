import { db } from "../connection.js";
import { roles } from "../schema/roles.js";

async function seedRoles() {
  await db.insert(roles).values([
    {
      name: "ADMIN",
      description: "Administrateur de la plateforme",
    },
    {
      name: "MANAGER",
      description: "Responsable de l'exploitation",
    },
    {
      name: "ELEVEUR",
      description: "Gestion du troupeau",
    },
    {
      name: "OUVRIER",
      description: "Employé de l'exploitation",
    },
    {
      name: "VETERINAIRE",
      description: "Suivi sanitaire des animaux",
    },
    {
      name: "COOPERATIVE",
      description: "Gestion multi-exploitations",
    },
  ]);

  console.log("✅ Les rôles ont été ajoutés.");

  process.exit(0);
}

seedRoles();