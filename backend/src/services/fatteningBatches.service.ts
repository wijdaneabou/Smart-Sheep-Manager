import {
  findFatteningBatchById,
  createFatteningBatch as createFatteningBatchInDb,
  updateFatteningBatch as updateFatteningBatchInDb,
  deleteFatteningBatch as deleteFatteningBatchInDb,
  listFatteningBatches as listFatteningBatchesInDb,
} from "../repositories/fatteningBatches.repository.js";
import { evaluateBatchForAlerts } from "./fatteningAlerts.service.js";

export type CreateFatteningBatchResult =
  | {
      success: true;
      status: 201;
      batch: NonNullable<Awaited<ReturnType<typeof findFatteningBatchById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createFatteningBatch(input: {
  name: string;
  startDate: string;
  animalCount: number;
  initialAverageWeight: number;
  targetWeight: number;
  estimatedEndDate?: string | null;
  exploitationId?: number | null;
  notes?: string | null;
  targetDailyGmq?: number | null;
}): Promise<CreateFatteningBatchResult> {
  const targetDailyGmq = computeTargetDailyGmqValue(
    input.initialAverageWeight,
    input.targetWeight,
    input.targetDailyGmq ?? null,
    input.startDate,
    input.estimatedEndDate ?? null
  );

  const batch = await createFatteningBatchInDb({
    name: input.name,
    startDate: input.startDate as any,
    animalCount: input.animalCount,
    initialAverageWeight: String(input.initialAverageWeight),
    targetWeight: String(input.targetWeight),
    targetDailyGmq: targetDailyGmq !== null ? String(targetDailyGmq) : undefined,
    estimatedEndDate: input.estimatedEndDate as any,
    exploitationId: input.exploitationId ?? undefined,
    notes: input.notes ?? undefined,
  });

  if (!batch) {
    return { success: false, status: 400, message: "Erreur lors de la création du lot." };
  }

  if (batch.id && targetDailyGmq !== null) {
    await evaluateBatchForAlerts(batch.id);
  }

  return { success: true, status: 201, batch };
}

function computeTargetDailyGmqValue(
  initialAverageWeight: number,
  targetWeight: number,
  providedTargetDailyGmq: number | null,
  startDate: string,
  estimatedEndDate: string | null
): number | null {
  if (providedTargetDailyGmq !== null && providedTargetDailyGmq !== undefined) {
    return providedTargetDailyGmq;
  }

  if (estimatedEndDate) {
    const start = new Date(startDate);
    const end = new Date(estimatedEndDate);
    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 0) {
      return (targetWeight - initialAverageWeight) / days;
    }
  }

  return null;
}

export type UpdateFatteningBatchResult =
  | {
      success: true;
      status: 200;
      batch: NonNullable<Awaited<ReturnType<typeof findFatteningBatchById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateFatteningBatch(
  id: number,
  input: {
    name?: string;
    startDate?: string;
    animalCount?: number;
    initialAverageWeight?: number;
    targetWeight?: number;
    estimatedEndDate?: string | null;
    status?: "ACTIVE" | "COMPLETED" | "CANCELLED";
    exploitationId?: number | null;
    notes?: string | null;
    targetDailyGmq?: number | null;
  }
): Promise<UpdateFatteningBatchResult> {
  const existing = await findFatteningBatchById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Lot d'engraissement introuvable." };
  }

  const startDate = input.startDate ?? String(existing.startDate);
  const initialAverageWeight = input.initialAverageWeight ?? Number(existing.initialAverageWeight);
  const targetWeight = input.targetWeight ?? Number(existing.targetWeight);
  const estimatedEndDate = input.estimatedEndDate ?? (existing.estimatedEndDate ? String(existing.estimatedEndDate) : null);
  const providedTargetDailyGmq = input.targetDailyGmq ?? Number(existing.targetDailyGmq ?? NaN);

  const targetDailyGmq = computeTargetDailyGmqValue(
    initialAverageWeight,
    targetWeight,
    Number.isNaN(providedTargetDailyGmq) ? null : providedTargetDailyGmq,
    startDate,
    estimatedEndDate
  );

  const updated = await updateFatteningBatchInDb(id, {
    name: input.name,
    startDate: input.startDate as any,
    animalCount: input.animalCount,
    initialAverageWeight: input.initialAverageWeight !== undefined ? String(input.initialAverageWeight) : undefined,
    targetWeight: input.targetWeight !== undefined ? String(input.targetWeight) : undefined,
    targetDailyGmq: targetDailyGmq !== null ? String(targetDailyGmq) : undefined,
    estimatedEndDate: input.estimatedEndDate !== undefined ? (input.estimatedEndDate as any) : undefined,
    status: input.status,
    exploitationId: input.exploitationId ?? undefined,
    notes: input.notes ?? undefined,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Lot d'engraissement introuvable." };
  }

  if (targetDailyGmq !== null) {
    await evaluateBatchForAlerts(id);
  }

  return { success: true, status: 200, batch: updated };
}

export type GetFatteningBatchResult =
  | {
      success: true;
      status: 200;
      batch: NonNullable<Awaited<ReturnType<typeof findFatteningBatchById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getFatteningBatchById(id: number): Promise<GetFatteningBatchResult> {
  const batch = await findFatteningBatchById(id);
  if (!batch) {
    return { success: false, status: 404, message: "Lot d'engraissement introuvable." };
  }
  return { success: true, status: 200, batch };
}

export async function listFatteningBatches(
  params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    exploitationId?: number;
  },
  exploitationIds?: number[]
) {
  const { rows, total } = await listFatteningBatchesInDb(params, exploitationIds);
  return {
    success: true,
    status: 200,
    batches: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type DeleteFatteningBatchResult =
  | {
      success: true;
      status: 200;
      message: string;
    }
  | { success: false; status: 404; message: string };

export async function deleteFatteningBatch(id: number): Promise<DeleteFatteningBatchResult> {
  const existing = await findFatteningBatchById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Lot d'engraissement introuvable." };
  }

  await deleteFatteningBatchInDb(id);
  return { success: true, status: 200, message: "Lot d'engraissement supprimé." };
}
