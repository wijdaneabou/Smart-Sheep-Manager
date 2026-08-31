import {
  createDelivery as createDeliveryInDb,
  updateDelivery as updateDeliveryInDb,
  findDeliveryById,
  deleteDelivery as deleteDeliveryInDb,
  listDeliveries as listDeliveriesInDb,
} from "../repositories/deliveries.repository.js";

export type CreateDeliveryResult =
  | {
      success: true;
      status: 201;
      delivery: NonNullable<Awaited<ReturnType<typeof findDeliveryById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createDelivery(input: {
  deliveryNumber: string;
  status?: "EN_ATTENTE" | "EN_COURS" | "LIVRE";
  deliveryDate: string;
  address: string;
  carrier: string;
  trackingNumber: string;
  deliveryNote?: string | null;
  clientId?: number | null;
  clientName: string;
  clientContact: string;
  notes?: string | null;
}): Promise<CreateDeliveryResult> {
  const delivery = await createDeliveryInDb({
    deliveryNumber: input.deliveryNumber,
    status: input.status ?? "EN_ATTENTE",
    deliveryDate: input.deliveryDate,
    address: input.address,
    carrier: input.carrier,
    trackingNumber: input.trackingNumber,
    deliveryNote: input.deliveryNote ?? undefined,
    clientId: input.clientId ?? undefined,
    clientName: input.clientName,
    clientContact: input.clientContact,
    notes: input.notes ?? undefined,
  });

  if (!delivery) {
    return { success: false, status: 400, message: "Erreur lors de la création de la livraison." };
  }

  return { success: true, status: 201, delivery };
}

export type UpdateDeliveryResult =
  | {
      success: true;
      status: 200;
      delivery: NonNullable<Awaited<ReturnType<typeof findDeliveryById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateDelivery(
  id: number,
  input: {
    deliveryNumber?: string;
    status?: "EN_ATTENTE" | "EN_COURS" | "LIVRE";
    deliveryDate?: string;
    address?: string;
    carrier?: string;
    trackingNumber?: string;
    deliveryNote?: string | null;
    clientId?: number | null;
    clientName?: string;
    clientContact?: string;
    notes?: string | null;
  }
): Promise<UpdateDeliveryResult> {
  const existing = await findDeliveryById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Livraison introuvable." };
  }

  const updated = await updateDeliveryInDb(id, {
    deliveryNumber: input.deliveryNumber,
    status: input.status,
    deliveryDate: input.deliveryDate,
    address: input.address,
    carrier: input.carrier,
    trackingNumber: input.trackingNumber,
    deliveryNote: input.deliveryNote,
    clientId: input.clientId,
    clientName: input.clientName,
    clientContact: input.clientContact,
    notes: input.notes,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Livraison introuvable." };
  }

  return { success: true, status: 200, delivery: updated };
}

export type GetDeliveryResult =
  | {
      success: true;
      status: 200;
      delivery: NonNullable<Awaited<ReturnType<typeof findDeliveryById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getDeliveryById(id: number): Promise<GetDeliveryResult> {
  const delivery = await findDeliveryById(id);
  if (!delivery) {
    return { success: false, status: 404, message: "Livraison introuvable." };
  }
  return { success: true, status: 200, delivery };
}

export async function listDeliveries(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) {
  const { rows, total } = await listDeliveriesInDb(params);
  return {
    success: true,
    status: 200,
    deliveries: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type DeleteDeliveryResult =
  | {
      success: true;
      status: 200;
      message: string;
    }
  | { success: false; status: 404; message: string };

export async function deleteDelivery(id: number): Promise<DeleteDeliveryResult> {
  const existing = await findDeliveryById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Livraison introuvable." };
  }

  await deleteDeliveryInDb(id);
  return { success: true, status: 200, message: "Livraison supprimée." };
}
