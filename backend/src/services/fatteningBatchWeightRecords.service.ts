import {
  createWeightRecord as createWeightRecordInDb,
  updateWeightRecord as updateWeightRecordInDb,
  findWeightRecordById,
  deleteWeightRecord as deleteWeightRecordInDb,
  listWeightRecordsByBatch,
  getBatchGmqStats,
} from "../repositories/fatteningBatchWeightRecords.repository.js";
import { evaluateBatchForAlerts } from "./fatteningAlerts.service.js";

export type CreateWeightRecordResult =
  | {
      success: true;
      status: 201;
      record: NonNullable<Awaited<ReturnType<typeof findWeightRecordById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function createWeightRecord(input: {
  fatteningBatchId: number;
  averageWeight: number;
  date: string;
  note?: string | null;
}): Promise<CreateWeightRecordResult> {
  const record = await createWeightRecordInDb({
    fatteningBatchId: input.fatteningBatchId,
    averageWeight: String(input.averageWeight),
    date: input.date as any,
    note: input.note ?? undefined,
  });

  if (!record) {
    return { success: false, status: 400, message: "Erreur lors de l'enregistrement de la pesée." };
  }

  await evaluateBatchForAlerts(input.fatteningBatchId);

  return { success: true, status: 201, record };
}

export type UpdateWeightRecordResult =
  | {
      success: true;
      status: 200;
      record: NonNullable<Awaited<ReturnType<typeof findWeightRecordById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateWeightRecord(
  id: number,
  input: {
    averageWeight?: number;
    date?: string;
    note?: string | null;
  }
): Promise<UpdateWeightRecordResult> {
  const existing = await findWeightRecordById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Pesée introuvable." };
  }

  const updated = await updateWeightRecordInDb(id, {
    averageWeight: input.averageWeight !== undefined ? String(input.averageWeight) : undefined,
    date: input.date !== undefined ? (input.date as any) : undefined,
    note: input.note,
  } as any);

  if (!updated) {
    return { success: false, status: 404, message: "Pesée introuvable." };
  }

  await evaluateBatchForAlerts(existing.fatteningBatchId);

  return { success: true, status: 200, record: updated };
}

export type GetWeightRecordsResult =
  | {
      success: true;
      status: 200;
      records: NonNullable<Awaited<ReturnType<typeof listWeightRecordsByBatch>>>;
      pagination: { total: number; limit: number; offset: number };
    }
  | { success: false; status: 404; message: string };

export async function getWeightRecordsByBatch(
  batchId: number,
  limit = 20,
  offset = 0
): Promise<GetWeightRecordsResult> {
  const result = await listWeightRecordsByBatch(batchId, limit, offset);
  if (!result) {
    return { success: false, status: 404, message: "Lot introuvable." };
  }
  return {
    success: true,
    status: 200,
    records: result.rows,
    pagination: { total: result.total, limit: result.limit, offset: result.offset },
  };
}

export type DeleteWeightRecordResult =
  | { success: true; status: 200; message: string }
  | { success: false; status: 404; message: string };

export async function deleteWeightRecord(id: number): Promise<DeleteWeightRecordResult> {
  const existing = await findWeightRecordById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Pesée introuvable." };
  }

  await deleteWeightRecordInDb(id);
  return { success: true, status: 200, message: "Pesée supprimée." };
}

export type GmqStatsResult =
  | { success: true; status: 200; stats: NonNullable<Awaited<ReturnType<typeof getBatchGmqStats>>> }
  | { success: false; status: 404; message: string };

export async function getGmqStats(batchId: number): Promise<GmqStatsResult> {
  const stats = await getBatchGmqStats(batchId);
  if (!stats) {
    return { success: false, status: 404, message: "Lot introuvable." };
  }
  return { success: true, status: 200, stats };
}
