import bcrypt from "bcrypt";
import { db } from "../connection.js";
import { users } from "../schema/users.js";

async function seedAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("Admin@2026", 10);

    await db.insert(users).values({
      firstName: "Super",
      lastName: "Admin",
      email: "f.laassiri0988@uca.ac.ma",
      phone: "0600000000",
      password: hashedPassword,
      roleId: 1, // ADMIN
      status: "ACTIVE",
    });

    console.log(" Administrateur créé avec succès.");
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

seedAdmin();