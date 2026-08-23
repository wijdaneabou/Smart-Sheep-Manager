import api from "./api";

export type ContractStatus = "EN_NEGOCIATION" | "ACTIF" | "EXPIRE" | "RESILIE";

export type FrameworkContract = {
  id: number;
  contractNumber: string;
  status: ContractStatus;
  clientId: number;
  clientName: string;
  monthlyVolume: string;
  yearlyVolume: string;
  negotiatedPrice: string;
  startDate: string;
  endDate: string;
  clauses: string | null;
  schedule: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
};

function extractError(err: any): string {
  const data = err?.response?.data;

  const fieldErrors = data?.error?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstField = Object.keys(fieldErrors)[0];
    const firstMessage = fieldErrors[firstField]?.[0];
    if (firstMessage) return `${firstField} : ${firstMessage}`;
  }

  const formErrors = data?.error?.formErrors;
  if (Array.isArray(formErrors) && formErrors.length > 0) {
    return formErrors[0];
  }

  const apiError = data?.error;
  if (typeof apiError === "string") return apiError;

  if (typeof data?.message === "string") return data.message;

  if (!err?.response) return "Impossible de contacter le serveur.";
  return `Erreur ${err.response.status} : la requête a été refusée.`;
}

export async function listFrameworkContracts(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ContractStatus;
  clientId?: number;
} = {}) {
  try {
    const response = await api.get<{
      data: FrameworkContract[];
      pagination: Pagination;
    }>("/framework-contracts", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getFrameworkContractById(id: number) {
  try {
    const response = await api.get<{ data: FrameworkContract }>(`/framework-contracts/${id}`);
    return { success: true as const, contract: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createFrameworkContract(input: {
  contractNumber: string;
  status?: ContractStatus;
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
}) {
  try {
    const response = await api.post<{ data: FrameworkContract }>("/framework-contracts", input);
    return {
      success: true as const,
      contract: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateFrameworkContract(
  id: number,
  input: Partial<{
    contractNumber: string;
    status: ContractStatus;
    clientId: number;
    clientName: string;
    monthlyVolume: string;
    yearlyVolume: string;
    negotiatedPrice: string;
    startDate: string;
    endDate: string;
    clauses: string | null;
    schedule: string | null;
    notes: string | null;
  }>
) {
  try {
    const response = await api.put<{ data: FrameworkContract }>(`/framework-contracts/${id}`, input);
    return {
      success: true as const,
      contract: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function deleteFrameworkContract(id: number) {
  try {
    await api.delete(`/framework-contracts/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
