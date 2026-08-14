import { db } from "../db/connection.js";
import { userExploitations } from "../db/schema/userExploitations.js";
import { eq } from "drizzle-orm";

export async function getUserExploitationIds(userId: number): Promise<number[]> {
  console.log(`[getUserExploitationIds] Fetching for userId: ${userId}`);
  try {
    const records = await db.select().from(userExploitations).where(eq(userExploitations.userId, userId));
    console.log(`[getUserExploitationIds] Found ${records.length} records:`, records.map(r => r.exploitationId));
    return records.map(r => r.exploitationId);
  } catch (error) {
    console.error(`[getUserExploitationIds] DB error:`, error);
    return [];
  }
}

export async function getUserExploitationIdsWithAdmin(user: any): Promise<number[] | null> {
  console.log(`[getUserExploitationIdsWithAdmin] Input user:`, user);
  if (!user || !user.id) {
    console.error(`[getUserExploitationIdsWithAdmin] Invalid user object (missing id)`);
    return [];
  }
  if (user.roleName?.toLowerCase() === 'admin') {
    console.log(`[getUserExploitationIdsWithAdmin] Admin => returning null (no filter)`);
    return null;
  }
  console.log(`[getUserExploitationIdsWithAdmin] Non-admin user ${user.id}, role "${user.roleName}"`);
  return getUserExploitationIds(user.id);
}