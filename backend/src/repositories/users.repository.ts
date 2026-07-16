import { db } from "../db/connection.js";
import { users } from "../db/schema/users.js";
import { eq } from "drizzle-orm";

export async function incrementFailedAttempts(userId: number) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return;

  await db
    .update(users)
    .set({
      failedAttempts: user.failedAttempts + 1,
    })
    .where(eq(users.id, userId));
}

export async function resetFailedAttempts(userId: number) {
  await db
    .update(users)
    .set({
      failedAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function lockUser(userId: number) {
  const lockUntil = new Date();
  lockUntil.setMinutes(lockUntil.getMinutes() + 15);

  await db
    .update(users)
    .set({
      failedAttempts: 5,
      lockedUntil: lockUntil,
    })
    .where(eq(users.id, userId));
}
export async function findUserByEmail(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  return user ?? null;
}