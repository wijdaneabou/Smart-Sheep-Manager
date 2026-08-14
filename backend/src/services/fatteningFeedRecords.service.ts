import {
  createFeedRecord as createFeedRecordInDb,
  updateFeedRecord as updateFeedRecordInDb,
  findFeedRecordById,
  deleteFeedRecord as deleteFeedRecordInDb,
  listFeedRecordsByBatch,
} from "../repositories/fatteningFeedRecords.repository.js";

export type CreateFeedRecordResult =
  | {
      success: true;
      status: 201;
      record: NonNullable<Awaited<ReturnType<typeof findFeedRecordById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createFeedRecord(input: {
  fatteningBatchId: number;
  date: string;
  feedType: string;
  quantityKg: number;
  unitPrice: number;
  note?: string | null;
}): Promise<CreateFeedRecordResult> {
  const totalCost = input.quantityKg * input.unitPrice;

  const record = await createFeedRecordInDb({
    fatteningBatchId: input.fatteningBatchId,
    date: input.date as any,
    feedType: input.feedType,
    quantityKg: String(input.quantityKg),
    unitPrice: String(input.unitPrice),
    totalCost: String(totalCost.toFixed(2)),
    note: input.note ?? undefined,
  });

  if (!record) {
    return { success: false, status: 400, message: "Erreur lors de l'enregistrement de l'alimentation." };
  }

  return { success: true, status: 201, record };
}

export type UpdateFeedRecordResult =
  | {
      success: true;
      status: 200;
      record: NonNullable<Awaited<ReturnType<typeof findFeedRecordById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateFeedRecord(
  id: number,
  input: {
    date?: string;
    feedType?: string;
    quantityKg?: number;
    unitPrice?: number;
    note?: string | null;
  }
): Promise<UpdateFeedRecordResult> {
  const existing = await findFeedRecordById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Enregistrement d'alimentation introuvable." };
  }

  const updateData: any = {};
  if (input.date !== undefined) updateData.date = input.date as any;
  if (input.feedType !== undefined) updateData.feedType = input.feedType;
  if (input.quantityKg !== undefined) updateData.quantityKg = String(input.quantityKg);
  if (input.unitPrice !== undefined) updateData.unitPrice = String(input.unitPrice);
  if (input.note !== undefined) updateData.note = input.note;

  if (input.quantityKg !== undefined && input.unitPrice !== undefined) {
    updateData.totalCost = String((input.quantityKg * input.unitPrice).toFixed(2));
  } else if (input.quantityKg !== undefined) {
    updateData.totalCost = String((input.quantityKg * Number(existing.unitPrice)).toFixed(2));
  } else if (input.unitPrice !== undefined) {
    updateData.totalCost = String((Number(existing.quantityKg) * input.unitPrice).toFixed(2));
  }

  const updated = await updateFeedRecordInDb(id, updateData);
  if (!updated) {
    return { success: false, status: 404, message: "Enregistrement d'alimentation introuvable." };
  }
  return { success: true, status: 200, record: updated };
}

export type GetFeedRecordsResult =
  | {
      success: true;
      status: 200;
      records: NonNullable<Awaited<ReturnType<typeof listFeedRecordsByBatch>>>;
    }
  | { success: false; status: 404; message: string };

export async function getFeedRecordsByBatch(batchId: number): Promise<GetFeedRecordsResult> {
  const records = await listFeedRecordsByBatch(batchId);
  return { success: true, status: 200, records };
}

export type DeleteFeedRecordResult =
  | { success: true; status: 200; message: string }
  | { success: false; status: 404; message: string };

export async function deleteFeedRecord(id: number): Promise<DeleteFeedRecordResult> {
  const existing = await findFeedRecordById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Enregistrement d'alimentation introuvable." };
  }
  await deleteFeedRecordInDb(id);
  return { success: true, status: 200, message: "Enregistrement d'alimentation supprimé." };
}
