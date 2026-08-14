import { db } from "../db/connection.js";
import { iotZones, type NewIotZone } from "../db/schema/iotZones.js";
import { eq, and, inArray } from "drizzle-orm"; // added inArray

export async function createZone(data: NewIotZone) {
  const [result] = await db.insert(iotZones).values(data).$returningId();
  return findZoneById(result.id);
}

export async function findZoneById(id: number) {
  const rows = await db.select().from(iotZones).where(eq(iotZones.id, id)).limit(1);
  return rows[0] ?? null;
}

/**
 * Liste les zones d'une ou plusieurs exploitations.
 * Si exploitationIds est null ou vide, aucune restriction (admin).
 */
export async function listZonesByExploitationIds(exploitationIds: number[] | null) {
  const conditions = [];
  if (exploitationIds && exploitationIds.length > 0) {
    conditions.push(inArray(iotZones.exploitationId, exploitationIds));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;
  return db.select().from(iotZones).where(whereClause);
}

export async function updateZone(
  id: number,
  data: Partial<Pick<NewIotZone, "name" | "color" | "polygon">>
) {
  await db
    .update(iotZones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(iotZones.id, id));
  return findZoneById(id);
}

export async function deleteZone(id: number) {
  await db.delete(iotZones).where(eq(iotZones.id, id));
}