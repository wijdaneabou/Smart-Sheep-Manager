import { db } from "../db/connection.js";
import {
  fatteningBatchWeightRecords,
} from "../db/schema/fatteningBatchWeightRecords.js";
import { fatteningBatches } from "../db/schema/fatteningBatches.js";
import { eq, and, desc, sql } from "drizzle-orm";

type CreateRecordData = typeof fatteningBatchWeightRecords.$inferInsert;
type UpdateRecordData = Partial<CreateRecordData>;

export async function findWeightRecordById(id: number) {
  const rows = await db
    .select()
    .from(fatteningBatchWeightRecords)
    .where(eq(fatteningBatchWeightRecords.id, id))
    .limit(1);

  return rows[0] || null;
}

export async function createWeightRecord(data: CreateRecordData) {
  const [result] = await db
    .insert(fatteningBatchWeightRecords)
    .values(data)
    .$returningId();
  return findWeightRecordById(result.id);
}

export async function updateWeightRecord(id: number, data: UpdateRecordData) {
  await db
    .update(fatteningBatchWeightRecords)
    .set({ ...data } as any)
    .where(eq(fatteningBatchWeightRecords.id, id));
  return findWeightRecordById(id);
}

export async function deleteWeightRecord(id: number) {
  await db
    .delete(fatteningBatchWeightRecords)
    .where(eq(fatteningBatchWeightRecords.id, id));
}

export async function listWeightRecordsByBatch(batchId: number) {
  return db
    .select()
    .from(fatteningBatchWeightRecords)
    .where(eq(fatteningBatchWeightRecords.fatteningBatchId, batchId))
    .orderBy(desc(fatteningBatchWeightRecords.date));
}

export async function getLatestWeightRecordByBatch(batchId: number) {
  const rows = await db
    .select()
    .from(fatteningBatchWeightRecords)
    .where(eq(fatteningBatchWeightRecords.fatteningBatchId, batchId))
    .orderBy(desc(fatteningBatchWeightRecords.date))
    .limit(1);

  return rows[0] || null;
}

export async function getFirstWeightRecordByBatch(batchId: number) {
  const rows = await db
    .select()
    .from(fatteningBatchWeightRecords)
    .where(eq(fatteningBatchWeightRecords.fatteningBatchId, batchId))
    .orderBy(fatteningBatchWeightRecords.date)
    .limit(1);

  return rows[0] || null;
}

export async function getBatchWeightHistory(batchId: number) {
  const records = await listWeightRecordsByBatch(batchId);
  const sorted = [...records].reverse();

  const dataPoints = sorted.map((record, index) => {
    const weight = Number(record.averageWeight);
    let dailyGmq: number | null = null;

    if (index > 0) {
      const prev = sorted[index - 1];
      const prevWeight = Number(prev.averageWeight);
      const daysDiff =
        (new Date(record.date).getTime() - new Date(prev.date).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysDiff > 0) {
        dailyGmq = (weight - prevWeight) / daysDiff;
      }
    }

    return {
      id: record.id,
      date: record.date,
      dateStr: new Date(record.date).toLocaleDateString("fr-FR"),
      weight,
      note: record.note,
      dailyGmq,
    };
  });

  const gmqValues = dataPoints
    .filter((p) => p.dailyGmq !== null)
    .map((p) => p.dailyGmq as number);
  const averageDailyGmq =
    gmqValues.length > 0
      ? gmqValues.reduce((sum, val) => sum + val, 0) / gmqValues.length
      : null;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  let overallGmq: number | null = null;
  if (first && last && first.id !== last.id) {
    const totalDays =
      (new Date(last.date).getTime() - new Date(first.date).getTime()) /
      (1000 * 60 * 60 * 24);
    if (totalDays > 0) {
      overallGmq =
        (Number(last.averageWeight) - Number(first.averageWeight)) / totalDays;
    }
  }

  return {
    dataPoints,
    averageDailyGmq,
    overallGmq,
    totalRecords: dataPoints.length,
    firstWeight: first ? Number(first.averageWeight) : null,
    lastWeight: last ? Number(last.averageWeight) : null,
  };
}

export async function getBatchGmqStats(batchId: number) {
  const history = await getBatchWeightHistory(batchId);
  const batch = await db
    .select()
    .from(fatteningBatches)
    .where(eq(fatteningBatches.id, batchId))
    .limit(1);

  const batchData = batch[0];
  if (!batchData) return null;

  const startDate = new Date(batchData.startDate);
  const today = new Date();
  const daysElapsed =
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

  const initialWeight = Number(batchData.initialAverageWeight);
  const targetWeight = Number(batchData.targetWeight);
  const targetGmq = targetWeight - initialWeight;

  return {
    history,
    daysElapsed: Math.max(daysElapsed, 0),
    initialWeight,
    targetWeight,
    targetGmq,
    projectedFinalWeight:
      daysElapsed > 0 && history.overallGmq !== null
        ? initialWeight + history.overallGmq * daysElapsed
        : null,
  };
}
