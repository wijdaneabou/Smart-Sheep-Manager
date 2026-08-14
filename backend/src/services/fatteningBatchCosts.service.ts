import {
  createBatchCost as createBatchCostInDb,
  updateBatchCost as updateBatchCostInDb,
  findBatchCostById,
  deleteBatchCost as deleteBatchCostInDb,
  listBatchCosts,
} from "../repositories/fatteningBatchCosts.repository.js";

export type CreateBatchCostResult =
  | {
      success: true;
      status: 201;
      cost: NonNullable<Awaited<ReturnType<typeof findBatchCostById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createBatchCost(input: {
  fatteningBatchId: number;
  category: string;
  description?: string | null;
  amount: number;
  date: string;
}): Promise<CreateBatchCostResult> {
  const cost = await createBatchCostInDb({
    fatteningBatchId: input.fatteningBatchId,
    category: input.category,
    description: input.description ?? undefined,
    amount: String(input.amount.toFixed(2)),
    date: input.date as any,
  });

  if (!cost) {
    return { success: false, status: 400, message: "Erreur lors de l'enregistrement du coût." };
  }

  return { success: true, status: 201, cost };
}

export type UpdateBatchCostResult =
  | {
      success: true;
      status: 200;
      cost: NonNullable<Awaited<ReturnType<typeof findBatchCostById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateBatchCost(
  id: number,
  input: {
    category?: string;
    description?: string | null;
    amount?: number;
    date?: string;
  }
): Promise<UpdateBatchCostResult> {
  const existing = await findBatchCostById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Coût introuvable." };
  }

  const updateData: any = {};
  if (input.category !== undefined) updateData.category = input.category;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.amount !== undefined) updateData.amount = String(input.amount.toFixed(2));
  if (input.date !== undefined) updateData.date = input.date as any;

  const updated = await updateBatchCostInDb(id, updateData);
  if (!updated) {
    return { success: false, status: 404, message: "Coût introuvable." };
  }
  return { success: true, status: 200, cost: updated };
}

export type GetBatchCostsResult =
  | {
      success: true;
      status: 200;
      costs: NonNullable<Awaited<ReturnType<typeof listBatchCosts>>>;
    }
  | { success: false; status: 404; message: string };

export async function getBatchCosts(batchId: number): Promise<GetBatchCostsResult> {
  const costs = await listBatchCosts(batchId);
  return { success: true, status: 200, costs };
}

export type DeleteBatchCostResult =
  | { success: true; status: 200; message: string }
  | { success: false; status: 404; message: string };

export async function deleteBatchCost(id: number): Promise<DeleteBatchCostResult> {
  const existing = await findBatchCostById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Coût introuvable." };
  }
  await deleteBatchCostInDb(id);
  return { success: true, status: 200, message: "Coût supprimé." };
}
