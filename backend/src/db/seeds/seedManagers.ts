import bcrypt from "bcrypt";
import { db } from "../connection.js";
import { users } from "../schema/users.js";

async function seedManagers() {
  try {
    const hashedPassword = await bcrypt.hash("wanaim0000", 10);

    for (let i = 2; i <= 51; i++) {
      await db.insert(users).values({
        firstName: "Manager",
        lastName: `${i}`,
        email: `m${i}@ssm.com`,
        phone: `06000000${String(i).padStart(2, "0")}`,
        password: hashedPassword,
        roleId: 2,
        status: "ACTIVE",
      });
    }

    console.log("✅ 50 managers (m2 à m51) créés avec succès.");
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

seedManagers();