import { getBatchesPerformance } from "../repositories/fatteningPerformance.repository.js";
import { getBatchWeightHistory } from "../repositories/fatteningBatchWeightRecords.repository.js";

export type BatchPerformance = {
  batchId: number;
  batchName: string;
  startDate: string | null;
  animalCount: number;
  initialWeight: number;
  targetWeight: number;
  currentWeight: number | null;
  status: string | null;
  exploitationId: number | null;
  daysElapsed: number;

  gmq: number | null;
  averageDailyGmq: number | null;
  totalWeightGain: number | null;

  totalFeedKg: number;
  totalFeedCost: number;
  fcr: number | null;

  totalCost: number;
  costPerKgGain: number | null;

  weightStdDev: number | null;
  weightAvg: number | null;
  weightMin: number | null;
  weightMax: number | null;
  weightCount: number;
  cv: number | null;
  homogeneityRating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | null;
};

export type BatchPerformanceComparisonResult =
  | {
      success: true;
      status: 200;
      batches: BatchPerformance[];
      rankings: {
        bestGmq: number[];
        bestFcr: number[];
        bestCostPerKg: number[];
        bestHomogeneity: number[];
      };
    }
  | { success: false; status: 400; message: string };

function computeStdDev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function getHomogeneityRating(cv: number | null): "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | null {
  if (cv === null) return null;
  if (cv <= 5) return "EXCELLENT";
  if (cv <= 10) return "GOOD";
  if (cv <= 15) return "FAIR";
  return "POOR";
}

export async function compareBatchPerformance(
  params: {
    exploitationId?: number;
    onlyCompleted?: boolean;
  },
  exploitationIds?: number[]
): Promise<BatchPerformanceComparisonResult> {
  if (!exploitationIds && !params.exploitationId) {
    return { success: false, status: 400, message: "exploitationId requis." };
  }

  const rows = await getBatchesPerformance(
    { exploitationId: params.exploitationId },
    exploitationIds
  );

  const batches: BatchPerformance[] = [];

  for (const row of rows) {
    if (params.onlyCompleted && row.status !== "COMPLETED") continue;

    const initialWeight = Number(row.initialAverageWeight);
    const targetWeight = Number(row.targetWeight);
    const currentWeight = row.lastWeight;

    let gmqValue: number | null = null;
    let averageDailyGmq: number | null = null;
    let totalWeightGain: number | null = null;

    if (row.firstWeight !== null && row.lastWeight !== null && row.totalDays > 0) {
      gmqValue = ((row.lastWeight - row.firstWeight) / row.totalDays) * 1000;
      totalWeightGain = (row.lastWeight - row.firstWeight) * row.animalCount;
    }

    if (gmqValue === null && currentWeight !== null) {
      gmqValue = ((currentWeight - initialWeight) / row.totalDays) * 1000;
      totalWeightGain = (currentWeight - initialWeight) * row.animalCount;
    }

    if (gmqValue !== null) {
      try {
        const history = await getBatchWeightHistory(row.batchId);
        const dailyGmqValues = history.dataPoints
          .filter((p) => p.dailyGmq !== null && p.dailyGmq > 0)
          .map((p) => (p.dailyGmq as number) * 1000);
        if (dailyGmqValues.length > 0) {
          averageDailyGmq = dailyGmqValues.reduce((sum, v) => sum + v, 0) / dailyGmqValues.length;
        }
      } catch {
        averageDailyGmq = null;
      }
    }

    let fcr: number | null = null;
    if (row.totalFeedKg > 0 && totalWeightGain !== null && totalWeightGain > 0) {
      fcr = row.totalFeedKg / totalWeightGain;
    }

    let costPerKgGain: number | null = null;
    if (row.totalCost > 0 && totalWeightGain !== null && totalWeightGain > 0) {
      costPerKgGain = row.totalCost / totalWeightGain;
    }

    let weightStdDev: number | null = null;
    let weightAvg: number | null = null;
    let weightMin: number | null = null;
    let weightMax: number | null = null;
    let cv: number | null = null;
    let homogeneityRating: "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | null = null;

    if (row.weightStdDev !== null && row.weightAvg !== null && row.weightAvg > 0) {
      weightStdDev = row.weightStdDev;
      weightAvg = row.weightAvg;
      cv = (weightStdDev / weightAvg) * 100;
      homogeneityRating = getHomogeneityRating(cv);
    }

    const daysElapsed = row.totalDays;

    batches.push({
      batchId: row.batchId,
      batchName: row.batchName,
      startDate: row.startDate ? new Date(row.startDate).toISOString().split("T")[0] : null,
      animalCount: row.animalCount,
      initialWeight,
      targetWeight,
      currentWeight,
      status: row.status,
      exploitationId: row.exploitationId,
      daysElapsed: Math.floor(daysElapsed),

      gmq: gmqValue,
      averageDailyGmq,
      totalWeightGain,

      totalFeedKg: row.totalFeedKg,
      totalFeedCost: row.totalFeedCost,
      fcr,

      totalCost: row.totalCost,
      costPerKgGain,

      weightStdDev,
      weightAvg,
      weightMin,
      weightMax,
      weightCount: row.weightCount,
      cv,
      homogeneityRating,
    });
  }

  const validGmq = batches.filter((b) => b.gmq !== null).sort((a, b) => (b.gmq as number) - (a.gmq as number));
  const validFcr = batches.filter((b) => b.fcr !== null && b.fcr > 0).sort((a, b) => (a.fcr as number) - (b.fcr as number));
  const validCost = batches
    .filter((b) => b.costPerKgGain !== null && b.costPerKgGain > 0)
    .sort((a, b) => (a.costPerKgGain as number) - (b.costPerKgGain as number));
  const validHomogeneity = batches.filter((b) => b.weightStdDev !== null && b.weightStdDev > 0).sort((a, b) => (a.weightStdDev as number) - (b.weightStdDev as number));

  const rankings = {
    bestGmq: validGmq.map((b) => b.batchId),
    bestFcr: validFcr.map((b) => b.batchId),
    bestCostPerKg: validCost.map((b) => b.batchId),
    bestHomogeneity: validHomogeneity.map((b) => b.batchId),
  };

  return {
    success: true,
    status: 200,
    batches,
    rankings,
  };
}
