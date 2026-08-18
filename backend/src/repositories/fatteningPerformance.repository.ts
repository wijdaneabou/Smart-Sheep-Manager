import { db } from "../db/connection.js";
import { fatteningBatches } from "../db/schema/fatteningBatches.js";
import { fatteningBatchWeightRecords } from "../db/schema/fatteningBatchWeightRecords.js";
import { fatteningFeedRecords } from "../db/schema/fatteningFeedRecords.js";
import { fatteningBatchCosts } from "../db/schema/fatteningBatchCosts.js";
import { fatteningBatchIndividualWeights } from "../db/schema/fatteningBatchIndividualWeights.js";
import { eq, and, inArray, sql, desc, asc } from "drizzle-orm";

interface BatchPerformanceRow {
  batchId: number;
  batchName: string;
  startDate: Date | null;
  animalCount: number;
  initialAverageWeight: string;
  targetWeight: string;
  targetDailyGmq: string | null;
  status: string | null;
  exploitationId: number | null;
  firstWeight: number | null;
  lastWeight: number | null;
  totalDays: number;
  totalFeedKg: number;
  totalFeedCost: number;
  totalCost: number;
  weightStdDev: number | null;
  weightAvg: number | null;
  weightCount: number;
}

export async function getBatchesPerformance(
  params: { exploitationId?: number; onlyActive?: boolean },
  exploitationIds?: number[]
): Promise<BatchPerformanceRow[]> {
  const conditions: any[] = [];

  if (exploitationIds && exploitationIds.length > 0) {
    conditions.push(inArray(fatteningBatches.exploitationId, exploitationIds));
  } else if (exploitationIds && exploitationIds.length === 0) {
    return [];
  }

  if (params.exploitationId) {
    conditions.push(eq(fatteningBatches.exploitationId, params.exploitationId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const batches = await db
    .select({
      batchId: fatteningBatches.id,
      batchName: fatteningBatches.name,
      startDate: fatteningBatches.startDate,
      animalCount: fatteningBatches.animalCount,
      initialAverageWeight: fatteningBatches.initialAverageWeight,
      targetWeight: fatteningBatches.targetWeight,
      targetDailyGmq: fatteningBatches.targetDailyGmq,
      status: fatteningBatches.status,
      exploitationId: fatteningBatches.exploitationId,
    })
    .from(fatteningBatches)
    .where(whereClause)
    .orderBy(desc(fatteningBatches.startDate));

  const results: BatchPerformanceRow[] = [];

  for (const batch of batches) {
    const batchId = batch.batchId;

    const weightRecords = await db
      .select({
        averageWeight: fatteningBatchWeightRecords.averageWeight,
        date: fatteningBatchWeightRecords.date,
      })
      .from(fatteningBatchWeightRecords)
      .where(eq(fatteningBatchWeightRecords.fatteningBatchId, batchId))
      .orderBy(asc(fatteningBatchWeightRecords.date));

    let firstWeight: number | null = null;
    let lastWeight: number | null = null;
    let totalDays = 0;

    if (weightRecords.length > 0) {
      firstWeight = Number(weightRecords[0].averageWeight);
      lastWeight = Number(weightRecords[weightRecords.length - 1].averageWeight);
      const firstDate = new Date(weightRecords[0].date);
      const lastDate = new Date(weightRecords[weightRecords.length - 1].date);
      totalDays = Math.max(
        (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24),
        1
      );
    } else {
      const today = new Date();
      const start = batch.startDate ? new Date(batch.startDate) : today;
      totalDays = Math.max(
        (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
        1
      );
    }

    const feedSummary = await db
      .select({
        totalQuantityKg: sql<number>`COALESCE(SUM(${fatteningFeedRecords.quantityKg}), 0)`,
        totalCost: sql<number>`COALESCE(SUM(${fatteningFeedRecords.totalCost}), 0)`,
      })
      .from(fatteningFeedRecords)
      .where(eq(fatteningFeedRecords.fatteningBatchId, batchId));

    const costSummary = await db
      .select({
        totalCost: sql<number>`COALESCE(SUM(${fatteningBatchCosts.amount}), 0)`,
      })
      .from(fatteningBatchCosts)
      .where(eq(fatteningBatchCosts.fatteningBatchId, batchId));

    const individualStats = await db
      .select({
        stdDev: sql<number>`STDDEV_SAMP(${fatteningBatchIndividualWeights.weight})`,
        avgWeight: sql<number>`AVG(${fatteningBatchIndividualWeights.weight})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(fatteningBatchIndividualWeights)
      .where(eq(fatteningBatchIndividualWeights.fatteningBatchId, batchId));

    const feedRow = feedSummary[0];
    const costRow = costSummary[0];
    const indStats = individualStats[0];

    results.push({
      batchId: batch.batchId,
      batchName: batch.batchName,
      startDate: batch.startDate,
      animalCount: batch.animalCount,
      initialAverageWeight: batch.initialAverageWeight,
      targetWeight: batch.targetWeight,
      targetDailyGmq: batch.targetDailyGmq,
      status: batch.status,
      exploitationId: batch.exploitationId,
      firstWeight,
      lastWeight,
      totalDays,
      totalFeedKg: Number(feedRow?.totalQuantityKg ?? 0),
      totalFeedCost: Number(feedRow?.totalCost ?? 0),
      totalCost: Number(feedRow?.totalCost ?? 0) + Number(costRow?.totalCost ?? 0),
      weightStdDev: indStats?.stdDev != null ? Number(indStats.stdDev) : null,
      weightAvg: indStats?.avgWeight != null ? Number(indStats.avgWeight) : null,
      weightCount: Number(indStats?.count ?? 0),
    });
  }

  return results;
}
