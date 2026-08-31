import {
  createFrameworkContract as createFrameworkContractInDb,
  updateFrameworkContract as updateFrameworkContractInDb,
  findFrameworkContractById,
  deleteFrameworkContract as deleteFrameworkContractInDb,
  listFrameworkContracts as listFrameworkContractsInDb,
} from "../repositories/framework-contracts.repository.js";

export type CreateFrameworkContractResult =
  | {
      success: true;
      status: 201;
      contract: NonNullable<Awaited<ReturnType<typeof findFrameworkContractById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createFrameworkContract(input: {
  contractNumber: string;
  status?: "EN_NEGOCIATION" | "ACTIF" | "EXPIRE" | "RESILIE";
  clientId: number;
  clientName: string;
  monthlyVolume: string;
  yearlyVolume: string;
  negotiatedPrice: string;
  startDate: string;
  endDate: string;
  clauses?: string | null;
  schedule?: string | null;
  notes?: string | null;
}): Promise<CreateFrameworkContractResult> {
  const contract = await createFrameworkContractInDb({
    contractNumber: input.contractNumber,
    status: input.status ?? "EN_NEGOCIATION",
    clientId: input.clientId,
    clientName: input.clientName,
    monthlyVolume: input.monthlyVolume,
    yearlyVolume: input.yearlyVolume,
    negotiatedPrice: input.negotiatedPrice,
    startDate: input.startDate,
    endDate: input.endDate,
    clauses: input.clauses ?? undefined,
    schedule: input.schedule ?? undefined,
    notes: input.notes ?? undefined,
  });

  if (!contract) {
    return { success: false, status: 400, message: "Erreur lors de la création du contrat cadre." };
  }

  return { success: true, status: 201, contract };
}

export type UpdateFrameworkContractResult =
  | {
      success: true;
      status: 200;
      contract: NonNullable<Awaited<ReturnType<typeof findFrameworkContractById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateFrameworkContract(
  id: number,
  input: {
    contractNumber?: string;
    status?: "EN_NEGOCIATION" | "ACTIF" | "EXPIRE" | "RESILIE";
    clientId?: number;
    clientName?: string;
    monthlyVolume?: string;
    yearlyVolume?: string;
    negotiatedPrice?: string;
    startDate?: string;
    endDate?: string;
    clauses?: string | null;
    schedule?: string | null;
    notes?: string | null;
  }
): Promise<UpdateFrameworkContractResult> {
  const existing = await findFrameworkContractById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Contrat cadre introuvable." };
  }

  const updated = await updateFrameworkContractInDb(id, {
    contractNumber: input.contractNumber,
    status: input.status,
    clientId: input.clientId,
    clientName: input.clientName,
    monthlyVolume: input.monthlyVolume,
    yearlyVolume: input.yearlyVolume,
    negotiatedPrice: input.negotiatedPrice,
    startDate: input.startDate,
    endDate: input.endDate,
    clauses: input.clauses,
    schedule: input.schedule,
    notes: input.notes,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Contrat cadre introuvable." };
  }

  return { success: true, status: 200, contract: updated };
}

export type GetFrameworkContractResult =
  | {
      success: true;
      status: 200;
      contract: NonNullable<Awaited<ReturnType<typeof findFrameworkContractById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getFrameworkContractById(id: number): Promise<GetFrameworkContractResult> {
  const contract = await findFrameworkContractById(id);
  if (!contract) {
    return { success: false, status: 404, message: "Contrat cadre introuvable." };
  }
  return { success: true, status: 200, contract };
}

export async function listFrameworkContracts(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  clientId?: number;
}) {
  const { rows, total } = await listFrameworkContractsInDb(params);
  return {
    success: true,
    status: 200,
    contracts: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type DeleteFrameworkContractResult =
  | {
      success: true;
      status: 200;
      message: string;
    }
  | { success: false; status: 404; message: string };

export async function deleteFrameworkContract(id: number): Promise<DeleteFrameworkContractResult> {
  const existing = await findFrameworkContractById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Contrat cadre introuvable." };
  }

  await deleteFrameworkContractInDb(id);
  return { success: true, status: 200, message: "Contrat cadre supprimé." };
}
