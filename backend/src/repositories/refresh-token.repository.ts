import { db } from "../db/connection.js";
import { refreshTokens } from "../db/schema/refreshTokens.js";
import { eq } from "drizzle-orm";

export async function saveRefreshToken(
  userId: number,
  token: string,
  expiresAt: Date
) {
  await db.insert(refreshTokens).values({
    userId,
    token,
    expiresAt,
  });
}

export async function findRefreshToken(token: string) {
  const result = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token));

  return result[0] ?? null;
}