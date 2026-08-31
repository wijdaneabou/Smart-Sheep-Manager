import {
  findClientById,
  createClient as createClientInDb,
  updateClient as updateClientInDb,
  deleteClient as deleteClientInDb,
  listClients as listClientsInDb,
} from "../repositories/clients.repository.js";

export type CreateClientResult =
  | {
      success: true;
      status: 201;
      client: NonNullable<Awaited<ReturnType<typeof findClientById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createClient(input: {
  name: string;
  contact: string;
  type: "ACHETEUR" | "BOUCHER" | "GROSSISTE" | "COOPERATIVE";
  purchaseHistory?: string | null;
  preferences?: string | null;
  notes?: string | null;
}): Promise<CreateClientResult> {
  const client = await createClientInDb({
    name: input.name,
    contact: input.contact,
    type: input.type,
    purchaseHistory: input.purchaseHistory ?? undefined,
    preferences: input.preferences ?? undefined,
    notes: input.notes ?? undefined,
  });

  if (!client) {
    return { success: false, status: 400, message: "Erreur lors de la création du client." };
  }

  return { success: true, status: 201, client };
}

export type UpdateClientResult =
  | {
      success: true;
      status: 200;
      client: NonNullable<Awaited<ReturnType<typeof findClientById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateClient(
  id: number,
  input: {
    name?: string;
    contact?: string;
    type?: "ACHETEUR" | "BOUCHER" | "GROSSISTE" | "COOPERATIVE";
    purchaseHistory?: string | null;
    preferences?: string | null;
    notes?: string | null;
  }
): Promise<UpdateClientResult> {
  const existing = await findClientById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Client introuvable." };
  }

  const updated = await updateClientInDb(id, {
    name: input.name,
    contact: input.contact,
    type: input.type,
    purchaseHistory: input.purchaseHistory ?? undefined,
    preferences: input.preferences ?? undefined,
    notes: input.notes ?? undefined,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Client introuvable." };
  }

  return { success: true, status: 200, client: updated };
}

export type GetClientResult =
  | {
      success: true;
      status: 200;
      client: NonNullable<Awaited<ReturnType<typeof findClientById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getClientById(id: number): Promise<GetClientResult> {
  const client = await findClientById(id);
  if (!client) {
    return { success: false, status: 404, message: "Client introuvable." };
  }
  return { success: true, status: 200, client };
}

export async function listClients(params: {
  page: number;
  limit: number;
  search?: string;
  type?: string;
}) {
  const { rows, total } = await listClientsInDb(params);
  return {
    success: true,
    status: 200,
    clients: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type DeleteClientResult =
  | {
      success: true;
      status: 200;
      message: string;
    }
  | { success: false; status: 404; message: string };

export async function deleteClient(id: number): Promise<DeleteClientResult> {
  const existing = await findClientById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Client introuvable." };
  }

  await deleteClientInDb(id);
  return { success: true, status: 200, message: "Client supprimé." };
}
