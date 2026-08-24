import bcrypt from "bcrypt";
import { db } from "../connection.js";
import { users } from "../schema/users.js";

async function seedVeterinaires() {
  try {
    const hashedPassword = await bcrypt.hash("wanaim0000", 10);

    for (let i = 51; i <= 100; i++) {
      await db.insert(users).values({
        firstName: "Vétérinaire",
        lastName: `${i}`,
        email: `v${i}@ssm.com`,
        phone: `06000001${String(i).padStart(3, "0")}`,
        password: hashedPassword,
        roleId: 5, // VÉTÉRINAIRE
        status: "ACTIVE",
      });
    }

    console.log("✅ 50 nouveaux vétérinaires (v51 à v100) créés avec succès.");
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

seedVeterinaires();