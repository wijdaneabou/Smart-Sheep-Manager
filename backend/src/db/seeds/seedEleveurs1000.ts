import bcrypt from "bcrypt";
import { db } from "../connection.js";
import { users } from "../schema/users.js";

async function seedEleveurs() {
  try {
    const hashedPassword = await bcrypt.hash("wanaim0000", 10);

    // Crée les éleveurs de e1 à e1000
    for (let i = 1; i <= 1000; i++) {
      await db.insert(users).values({
        firstName: "Éleveur",
        lastName: `${i}`,
        email: `e${i}@ssm.com`,
        phone: `06000002${String(i).padStart(3, "0")}`,
        password: hashedPassword,
        roleId: 3, // ÉLEVEUR
        status: "ACTIVE",
      });
    }

    console.log("✅ 1000 éleveurs (e1 à e1000) créés avec succès.");
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

seedEleveurs();