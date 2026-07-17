import { db } from "../db/connection.js";
import { passwordResets } from "../db/schema/passwordResets.js";
import { eq, and, gt } from "drizzle-orm";

export async function createResetCode(
  userId: number,
  code: string,
  expiresAt: Date
) {
  return db.insert(passwordResets).values({
    userId,
    code,
    expiresAt,
  });
}

export async function findValidCode(code: string) {
  return db.query.passwordResets.findFirst({
    where: and(
      eq(passwordResets.code, code),
      eq(passwordResets.used, false),
      gt(passwordResets.expiresAt, new Date())
    ),
  });
}

export async function markCodeAsUsed(id: number) {
  return db
    .update(passwordResets)
    .set({
      used: true,
    })
    .where(eq(passwordResets.id, id));
}

export async function deleteUserCodes(userId: number) {
  return db
    .delete(passwordResets)
    .where(eq(passwordResets.userId, userId));
}