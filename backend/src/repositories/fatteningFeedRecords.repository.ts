import { db } from "../db/connection.js";
import { fatteningFeedRecords } from "../db/schema/fatteningFeedRecords.js";
import { eq, desc, sum, sql } from "drizzle-orm";

type CreateFeedRecordData = typeof fatteningFeedRecords.$inferInsert;

export async function findFeedRecordById(id: number) {
  const rows = await db
    .select()
    .from(fatteningFeedRecords)
    .where(eq(fatteningFeedRecords.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function createFeedRecord(data: CreateFeedRecordData) {
  const [result] = await db
    .insert(fatteningFeedRecords)
    .values(data)
    .$returningId();
  return findFeedRecordById(result.id);
}

export async function updateFeedRecord(id: number, data: Partial<CreateFeedRecordData>) {
  await db
    .update(fatteningFeedRecords)
    .set({ ...data })
    .where(eq(fatteningFeedRecords.id, id));
  return findFeedRecordById(id);
}

export async function deleteFeedRecord(id: number) {
  await db.delete(fatteningFeedRecords).where(eq(fatteningFeedRecords.id, id));
}

export async function listFeedRecordsByBatch(batchId: number) {
  return db
    .select()
    .from(fatteningFeedRecords)
    .where(eq(fatteningFeedRecords.fatteningBatchId, batchId))
    .orderBy(desc(fatteningFeedRecords.date));
}

export async function getBatchFeedSummary(batchId: number) {
  const rows = await db
    .select({
      totalQuantityKg: sql<number>`COALESCE(SUM(${fatteningFeedRecords.quantityKg}), 0)`,
      totalCount: sql<number>`COUNT(*)`,
    })
    .from(fatteningFeedRecords)
    .where(eq(fatteningFeedRecords.fatteningBatchId, batchId));

  return rows[0];
}
