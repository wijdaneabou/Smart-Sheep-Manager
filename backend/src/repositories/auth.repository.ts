import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";

export async function findUserByEmail(email: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  return result[0] ?? null;
}