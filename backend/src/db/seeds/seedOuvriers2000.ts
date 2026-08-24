import bcrypt from "bcrypt";
import { db } from "../connection.js";
import { users } from "../schema/users.js";

async function seedOuvriers() {
  try {
    const hashedPassword = await bcrypt.hash("wanaim0000", 10);

    for (let i = 1; i <= 2000; i++) {
      await db.insert(users).values({
        firstName: "Ouvrier",
        lastName: `${i}`,
        email: `o${i}@ssm.com`,
        phone: `06000003${String(i).padStart(4, "0")}`,
        password: hashedPassword,
        roleId: 4, // OUVRIER
        status: "ACTIVE",
      });
    }

    console.log("✅ 2000 ouvriers (o1 à o2000) créés avec succès.");
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

seedOuvriers();