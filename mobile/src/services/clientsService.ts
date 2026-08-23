import api from "./api";

export type ClientType = "ACHETEUR" | "BOUCHER" | "GROSSISTE" | "COOPERATIVE";

export type Client = {
  id: number;
  name: string;
  contact: string;
  type: ClientType;
  purchaseHistory: string | null;
  preferences: string | null;
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

export async function listClients(params: {
  page?: number;
  limit?: number;
  search?: string;
  type?: ClientType;
} = {}) {
  try {
    const response = await api.get<{
      data: Client[];
      pagination: Pagination;
    }>("/clients", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getClientById(id: number) {
  try {
    const response = await api.get<{ data: Client }>(`/clients/${id}`);
    return { success: true as const, client: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createClient(input: {
  name: string;
  contact: string;
  type: ClientType;
  purchaseHistory?: string | null;
  preferences?: string | null;
  notes?: string | null;
}) {
  try {
    const response = await api.post<{ data: Client }>("/clients", input);
    return {
      success: true as const,
      client: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateClient(
  id: number,
  input: Partial<{
    name: string;
    contact: string;
    type: ClientType;
    purchaseHistory: string | null;
    preferences: string | null;
    notes: string | null;
  }>
) {
  try {
    const response = await api.put<{ data: Client }>(`/clients/${id}`, input);
    return {
      success: true as const,
      client: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function deleteClient(id: number) {
  try {
    await api.delete(`/clients/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
