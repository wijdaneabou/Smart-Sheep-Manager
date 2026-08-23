import api from "./api";

export type DeliveryStatus = "EN_ATTENTE" | "EN_COURS" | "LIVRE";

export type Delivery = {
  id: number;
  deliveryNumber: string;
  status: DeliveryStatus;
  deliveryDate: string;
  address: string;
  carrier: string;
  trackingNumber: string;
  deliveryNote: string | null;
  clientId: number | null;
  clientName: string;
  clientContact: string;
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

export async function listDeliveries(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: DeliveryStatus;
} = {}) {
  try {
    const response = await api.get<{
      data: Delivery[];
      pagination: Pagination;
    }>("/deliveries", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getDeliveryById(id: number) {
  try {
    const response = await api.get<{ data: Delivery }>(`/deliveries/${id}`);
    return { success: true as const, delivery: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createDelivery(input: {
  deliveryNumber: string;
  status?: DeliveryStatus;
  deliveryDate: string;
  address: string;
  carrier: string;
  trackingNumber: string;
  deliveryNote?: string | null;
  clientId?: number | null;
  clientName: string;
  clientContact: string;
  notes?: string | null;
}) {
  try {
    const response = await api.post<{ data: Delivery }>("/deliveries", input);
    return {
      success: true as const,
      delivery: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateDelivery(
  id: number,
  input: Partial<{
    deliveryNumber: string;
    status: DeliveryStatus;
    deliveryDate: string;
    address: string;
    carrier: string;
    trackingNumber: string;
    deliveryNote: string | null;
    clientId: number | null;
    clientName: string;
    clientContact: string;
    notes: string | null;
  }>
) {
  try {
    const response = await api.put<{ data: Delivery }>(`/deliveries/${id}`, input);
    return {
      success: true as const,
      delivery: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function deleteDelivery(id: number) {
  try {
    await api.delete(`/deliveries/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
