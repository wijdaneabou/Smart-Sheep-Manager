import {
  findMovementById,
  createMovement as createMovementInDb,
  listMovements as listMovementsInDb,
} from "../repositories/animalMovements.repository.js";
import { findAnimalById } from "../repositories/animals.repository.js";

export type CreateMovementResult =
  | {
      success: true;
      status: 201;
      movement: NonNullable<Awaited<ReturnType<typeof findMovementById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function createMovement(input: {
  animalId: number;
  type: "ENTRY" | "EXIT" | "DEATH" | "SALE" | "PURCHASE";
  date: string;
  reason?: string;
  sourceDestination?: string;
  price?: number;
}): Promise<CreateMovementResult> {
  // Vérifier que l'animal existe
  const animal = await findAnimalById(input.animalId);
  if (!animal) {
    return { success: false, status: 404, message: "Animal introuvable." };
  }

  const movement = await createMovementInDb({
    animalId: input.animalId,
    type: input.type,
    date: input.date as any,
    reason: input.reason,
    sourceDestination: input.sourceDestination,
    price: input.price !== undefined ? String(input.price) : undefined,
  });

  if (!movement) {
    return { success: false, status: 400, message: "Erreur lors de la création." };
  }

  return { success: true, status: 201, movement };
}

export async function listMovements(params: {
  page: number;
  limit: number;
  animalId?: number;
  type?: string;
  from?: string;
  to?: string;
}) {
  const { rows, total } = await listMovementsInDb(params);
  return {
    success: true as const,
    status: 200 as const,
    movements: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
