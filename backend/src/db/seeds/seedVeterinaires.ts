import bcrypt from "bcrypt";
import { db } from "../connection.js";
import { users } from "../schema/users.js";

async function seedVeterinaires() {
  try {
    const hashedPassword = await bcrypt.hash("wanaim0000", 10);

    for (let i = 1; i <= 50; i++) {
      await db.insert(users).values({
        firstName: "Vétérinaire",
        lastName: `${i}`,
        email: `v${i}@ssm.com`,
        phone: `06000001${String(i).padStart(2, "0")}`,
        password: hashedPassword,
        roleId: 5, // VÉTÉRINAIRE
        status: "ACTIVE",
      });
    }

    console.log("✅ 50 vétérinaires (v1 à v50) créés avec succès.");
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

seedVeterinaires();