import {
  createIndividualWeight as createIndividualWeightInDb,
  updateIndividualWeight as updateIndividualWeightInDb,
  findIndividualWeightById,
  deleteIndividualWeight as deleteIndividualWeightInDb,
  listIndividualWeightsByBatch,
} from "../repositories/fatteningBatchIndividualWeights.repository.js";

export type CreateIndividualWeightResult =
  | {
      success: true;
      status: 201;
      record: NonNullable<Awaited<ReturnType<typeof findIndividualWeightById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createIndividualWeight(input: {
  fatteningBatchId: number;
  animalId?: number | null;
  weight: number;
  date: string;
  note?: string | null;
}): Promise<CreateIndividualWeightResult> {
  const record = await createIndividualWeightInDb({
    fatteningBatchId: input.fatteningBatchId,
    animalId: input.animalId ?? undefined,
    weight: String(input.weight),
    date: input.date as any,
    note: input.note ?? undefined,
  });

  if (!record) {
    return { success: false, status: 400, message: "Erreur lors de l'enregistrement du poids." };
  }

  return { success: true, status: 201, record };
}

export type UpdateIndividualWeightResult =
  | {
      success: true;
      status: 200;
      record: NonNullable<Awaited<ReturnType<typeof findIndividualWeightById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateIndividualWeight(
  id: number,
  input: {
    animalId?: number | null;
    weight?: number;
    date?: string;
    note?: string | null;
  }
): Promise<UpdateIndividualWeightResult> {
  const existing = await findIndividualWeightById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Enregistrement de poids introuvable." };
  }

  const updateData: any = {};
  if (input.animalId !== undefined) updateData.animalId = input.animalId;
  if (input.weight !== undefined) updateData.weight = String(input.weight);
  if (input.date !== undefined) updateData.date = input.date as any;
  if (input.note !== undefined) updateData.note = input.note;

  const updated = await updateIndividualWeightInDb(id, updateData);
  if (!updated) {
    return { success: false, status: 404, message: "Enregistrement de poids introuvable." };
  }
  return { success: true, status: 200, record: updated };
}

export type GetIndividualWeightsResult =
  | {
      success: true;
      status: 200;
      records: NonNullable<Awaited<ReturnType<typeof listIndividualWeightsByBatch>>>;
    }
  | { success: false; status: 404; message: string };

export async function getIndividualWeightsByBatch(batchId: number): Promise<GetIndividualWeightsResult> {
  const records = await listIndividualWeightsByBatch(batchId);
  return { success: true, status: 200, records };
}

export type DeleteIndividualWeightResult =
  | { success: true; status: 200; message: string }
  | { success: false; status: 404; message: string };

export async function deleteIndividualWeight(id: number): Promise<DeleteIndividualWeightResult> {
  const existing = await findIndividualWeightById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Enregistrement de poids introuvable." };
  }
  await deleteIndividualWeightInDb(id);
  return { success: true, status: 200, message: "Enregistrement de poids supprimé." };
}
