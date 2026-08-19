import { db } from "../db/connection.js";
import { exploitations } from "../db/schema/exploitations.js";
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

  const roleName = String(user.roleName ?? "").toLowerCase();
  const isAdmin = roleName === "admin" || roleName === "administrator" || user.roleId === 1;
  const isCooperative = roleName === "cooperative";

  if (isAdmin || isCooperative) {
    console.log(`[getUserExploitationIdsWithAdmin] Admin => returning null (no filter)`);
    return null;
  }

  console.log(`[getUserExploitationIdsWithAdmin] Non-admin user ${user.id}, role "${user.roleName}"`);

  const owned = await db
    .select({ id: exploitations.id })
    .from(exploitations)
    .where(eq(exploitations.ownerId, user.id));

  const linked = await db
    .select({ exploitationId: userExploitations.exploitationId })
    .from(userExploitations)
    .where(eq(userExploitations.userId, user.id));

  const ids = new Set<number>();
  owned.forEach((row) => ids.add(row.id));
  linked.forEach((row) => ids.add(row.exploitationId));

  const result = Array.from(ids);
  console.log(`[getUserExploitationIdsWithAdmin] Resolved exploitations:`, result);
  return result;
}