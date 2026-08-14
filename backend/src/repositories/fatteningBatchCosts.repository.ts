import { db } from "../db/connection.js";
import { fatteningBatchCosts } from "../db/schema/fatteningBatchCosts.js";
import { eq, desc, sql } from "drizzle-orm";

type CreateBatchCostData = typeof fatteningBatchCosts.$inferInsert;

export async function findBatchCostById(id: number) {
  const rows = await db
    .select()
    .from(fatteningBatchCosts)
    .where(eq(fatteningBatchCosts.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function createBatchCost(data: CreateBatchCostData) {
  const [result] = await db
    .insert(fatteningBatchCosts)
    .values(data)
    .$returningId();
  return findBatchCostById(result.id);
}

export async function updateBatchCost(id: number, data: Partial<CreateBatchCostData>) {
  await db
    .update(fatteningBatchCosts)
    .set({ ...data })
    .where(eq(fatteningBatchCosts.id, id));
  return findBatchCostById(id);
}

export async function deleteBatchCost(id: number) {
  await db.delete(fatteningBatchCosts).where(eq(fatteningBatchCosts.id, id));
}

export async function listBatchCosts(batchId: number) {
  return db
    .select()
    .from(fatteningBatchCosts)
    .where(eq(fatteningBatchCosts.fatteningBatchId, batchId))
    .orderBy(desc(fatteningBatchCosts.date));
}

export async function getBatchCostSummary(batchId: number) {
  const rows = await db
    .select({
      totalCost: sql<number>`COALESCE(SUM(${fatteningBatchCosts.amount}), 0)`,
      totalCount: sql<number>`COUNT(*)`,
    })
    .from(fatteningBatchCosts)
    .where(eq(fatteningBatchCosts.fatteningBatchId, batchId));

  return rows[0];
}
