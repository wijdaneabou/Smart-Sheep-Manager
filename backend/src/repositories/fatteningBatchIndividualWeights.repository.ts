import { db } from "../db/connection.js";
import { fatteningBatchIndividualWeights } from "../db/schema/fatteningBatchIndividualWeights.js";
import { eq, desc, sql } from "drizzle-orm";

type CreateIndividualWeightData = typeof fatteningBatchIndividualWeights.$inferInsert;

export async function findIndividualWeightById(id: number) {
  const rows = await db
    .select()
    .from(fatteningBatchIndividualWeights)
    .where(eq(fatteningBatchIndividualWeights.id, id))
    .limit(1);
  return rows[0] || null;
}

export async function createIndividualWeight(data: CreateIndividualWeightData) {
  const [result] = await db
    .insert(fatteningBatchIndividualWeights)
    .values(data)
    .$returningId();
  return findIndividualWeightById(result.id);
}

export async function updateIndividualWeight(id: number, data: Partial<CreateIndividualWeightData>) {
  await db
    .update(fatteningBatchIndividualWeights)
    .set({ ...data })
    .where(eq(fatteningBatchIndividualWeights.id, id));
  return findIndividualWeightById(id);
}

export async function deleteIndividualWeight(id: number) {
  await db
    .delete(fatteningBatchIndividualWeights)
    .where(eq(fatteningBatchIndividualWeights.id, id));
}

export async function listIndividualWeightsByBatch(batchId: number) {
  return db
    .select()
    .from(fatteningBatchIndividualWeights)
    .where(eq(fatteningBatchIndividualWeights.fatteningBatchId, batchId))
    .orderBy(desc(fatteningBatchIndividualWeights.date), desc(fatteningBatchIndividualWeights.id));
}

export async function getBatchWeightStdDev(batchId: number) {
  const rows = await db
    .select({
      stdDev: sql<number>`COALESCE(STDDEV_SAMP(${fatteningBatchIndividualWeights.weight}), 0)`,
      avgWeight: sql<number>`AVG(${fatteningBatchIndividualWeights.weight})`,
      minWeight: sql<number>`MIN(${fatteningBatchIndividualWeights.weight})`,
      maxWeight: sql<number>`MAX(${fatteningBatchIndividualWeights.weight})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(fatteningBatchIndividualWeights)
    .where(eq(fatteningBatchIndividualWeights.fatteningBatchId, batchId));

  return rows[0];
}
