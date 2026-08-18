import {
  createFatteningAlert as createFatteningAlertInDb,
  findFatteningAlertById,
  resolveFatteningAlert,
  listFatteningAlertsByBatch,
  listFatteningAlertsByExploitation,
  hasUnresolvedFatteningAlert,
  listUnresolvedFatteningAlertsByBatch,
  countUnresolvedFatteningAlertsByExploitation,
} from "../repositories/fatteningAlerts.repository.js";
import { getGmqStats } from "./fatteningBatchWeightRecords.service.js";
import { findFatteningBatchById } from "../repositories/fatteningBatches.repository.js";

export type FatteningAlertType = "LOW_GMQ" | "WEIGHT_DEVIATION";
export type FatteningAlertSeverity = "WARNING" | "CRITICAL";

export interface SerializedFatteningAlert {
  id: number;
  fatteningBatchId: number;
  exploitationId: number | null;
  type: FatteningAlertType;
  severity: FatteningAlertSeverity;
  message: string;
  value: string | null;
  threshold: string | null;
  resolved: boolean;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function serializeFatteningAlert(row: any): SerializedFatteningAlert {
  return {
    id: row.id,
    fatteningBatchId: row.fatteningBatchId,
    exploitationId: row.exploitationId,
    type: row.type,
    severity: row.severity,
    message: row.message,
    value: row.value,
    threshold: row.threshold,
    resolved: Boolean(row.resolved),
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function computeTargetDailyGmq(batch: {
  initialAverageWeight: string | number;
  targetWeight: string | number;
  targetDailyGmq: string | number | null;
  startDate: string | Date;
  estimatedEndDate: string | Date | null;
}): number | null {
  if (batch.targetDailyGmq !== null && batch.targetDailyGmq !== undefined) {
    return Number(batch.targetDailyGmq);
  }

  if (batch.estimatedEndDate) {
    const start = new Date(batch.startDate);
    const end = new Date(batch.estimatedEndDate);
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 0) {
      return (Number(batch.targetWeight) - Number(batch.initialAverageWeight)) / days;
    }
  }

  return null;
}

export async function evaluateBatchForAlerts(batchId: number) {
  const batchResult = await findFatteningBatchById(batchId);
  if (!batchResult) return;

  const batch = batchResult;
  const targetDailyGmq = computeTargetDailyGmq(batch);

  if (targetDailyGmq === null) return;

  const statsResult = await getGmqStats(batchId);
  if (!statsResult.success || !statsResult.stats) return;

  const stats = statsResult.stats;
  const alertsToCreate: Array<{
    type: FatteningAlertType;
    severity: FatteningAlertSeverity;
    message: string;
    value: string;
    threshold: string;
  }> = [];

  const overallGmq = stats.history.overallGmq;
  const latestWeight = stats.history.lastWeight;
  const daysElapsed = stats.daysElapsed;

  if (overallGmq !== null && daysElapsed >= 7) {
    const alreadyLowGmq = await hasUnresolvedFatteningAlert(batchId, "LOW_GMQ");
    const gmqThreshold = targetDailyGmq * 0.8;

    if (overallGmq < gmqThreshold) {
      if (!alreadyLowGmq) {
        alertsToCreate.push({
          type: "LOW_GMQ",
          severity: "WARNING",
          message: `GMQ faible : ${(overallGmq * 1000).toFixed(0)} g/j (seuil ${(gmqThreshold * 1000).toFixed(0)} g/j). Lot ${batch.name}.`,
          value: `${(overallGmq * 1000).toFixed(0)} g/j`,
          threshold: `${(gmqThreshold * 1000).toFixed(0)} g/j`,
        });
      }
    } else if (alreadyLowGmq) {
      const unresolved = await listUnresolvedFatteningAlertsByBatch(batchId);
      const lowGmqAlert = unresolved.find((a) => a.type === "LOW_GMQ");
      if (lowGmqAlert) {
        await resolveFatteningAlert(lowGmqAlert.id);
      }
    }
  }

  if (latestWeight !== null && daysElapsed >= 1) {
    const theoreticalWeight = Number(batch.initialAverageWeight) + targetDailyGmq * daysElapsed;
    const deviation = Math.abs(latestWeight - theoreticalWeight);
    const alreadyDeviation = await hasUnresolvedFatteningAlert(batchId, "WEIGHT_DEVIATION");

    if (deviation > 5) {
      if (!alreadyDeviation) {
        const diffSign = latestWeight > theoreticalWeight ? "+" : "";
        alertsToCreate.push({
          type: "WEIGHT_DEVIATION",
          severity: deviation > 10 ? "CRITICAL" : "WARNING",
          message: `Écart de poids : ${latestWeight.toFixed(2)} kg vs théorique ${theoreticalWeight.toFixed(2)} kg (écart ${diffSign}${deviation.toFixed(2)} kg > 5 kg). Lot ${batch.name}.`,
          value: `${deviation.toFixed(2)} kg`,
          threshold: "5 kg",
        });
      }
    } else if (alreadyDeviation) {
      const unresolved = await listUnresolvedFatteningAlertsByBatch(batchId);
      const deviationAlert = unresolved.find((a) => a.type === "WEIGHT_DEVIATION");
      if (deviationAlert) {
        await resolveFatteningAlert(deviationAlert.id);
      }
    }
  }

  for (const alert of alertsToCreate) {
    await createFatteningAlertInDb({
      fatteningBatchId: batchId,
      exploitationId: batch.exploitationId ?? null,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      value: alert.value,
      threshold: alert.threshold,
      resolved: 0,
    });
  }
}

export type ListFatteningAlertsResult =
  | { success: true; status: 200; alerts: SerializedFatteningAlert[]; total: number }
  | { success: false; status: 400; message: string };

export async function listFatteningAlerts(params: {
  fatteningBatchId?: number;
  exploitationId?: number;
  resolved?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<ListFatteningAlertsResult> {
  if (!params.fatteningBatchId && !params.exploitationId) {
    return { success: false, status: 400, message: "fatteningBatchId ou exploitationId requis." };
  }

  let rows: any[];
  let total: number;

  if (params.fatteningBatchId) {
    const result = await listFatteningAlertsByBatch(params.fatteningBatchId, { resolved: params.resolved });
    rows = result;
    total = result.length;
  } else {
    const result = await listFatteningAlertsByExploitation(params.exploitationId!, {
      resolved: params.resolved,
      type: params.type,
      limit: params.limit,
      offset: params.offset,
    });
    rows = result.rows;
    total = result.total;
  }

  return {
    success: true,
    status: 200,
    alerts: rows.map(serializeFatteningAlert),
    total,
  };
}

export type ResolveFatteningAlertResult =
  | { success: true; status: 200; alert: SerializedFatteningAlert }
  | { success: false; status: 404; message: string };

export async function resolveFatteningAlertById(id: number): Promise<ResolveFatteningAlertResult> {
  const existing = await findFatteningAlertById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Alerte introuvable." };
  }
  const resolved = await resolveFatteningAlert(id);
  return { success: true, status: 200, alert: serializeFatteningAlert(resolved) };
}

export type AlertSummaryResult =
  | { success: true; status: 200; summary: Record<string, number> }
  | { success: false; status: 400; message: string };

export async function getFatteningAlertSummary(exploitationId: number): Promise<AlertSummaryResult> {
  if (!exploitationId) {
    return { success: false, status: 400, message: "exploitationId requis." };
  }
  const counts = await countUnresolvedFatteningAlertsByExploitation(exploitationId);
  const summary: Record<string, number> = {};
  for (const row of counts) {
    summary[row.type] = Number(row.count);
  }
  return { success: true, status: 200, summary };
}
