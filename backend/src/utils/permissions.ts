import { db } from "../db/connection.js";
import { exploitations } from "../db/schema/exploitations.js";
import { userExploitations } from "../db/schema/userExploitations.js";
import { eq } from "drizzle-orm";

export async function getUserExploitationIds(
  userId: number,
  roleName: string | null | undefined,
  roleId?: number
): Promise<number[]> {
  const roleUpper = roleName?.toUpperCase() || '';
  const isAdmin = roleId === 1 || roleUpper === 'ADMIN' || roleUpper === 'ADMINISTRATOR';
  const isCooperative = roleUpper === 'COOPERATIVE';

  // Admin et Cooperative voient tout
  if (isAdmin || isCooperative) {
    const all = await db.select({ id: exploitations.id }).from(exploitations);
    return all.map(e => e.id);
  }

  // 1. Exploitations dont l'utilisateur est propriétaire
  const owned = await db
    .select({ id: exploitations.id })
    .from(exploitations)
    .where(eq(exploitations.ownerId, userId));

  // 2. Exploitations via la table user_exploitations
  const linked = await db
    .select({ exploitationId: userExploitations.exploitationId })
    .from(userExploitations)
    .where(eq(userExploitations.userId, userId));

  const ids = new Set<number>();
  owned.forEach(e => ids.add(e.id));
  linked.forEach(e => ids.add(e.exploitationId));

  return Array.from(ids);
}