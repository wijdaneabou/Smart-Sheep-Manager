import api from "./api";

export type OrderStatus = "BROUILLON" | "ENVOYE" | "VALIDE" | "EN_PREPARATION" | "EXPEDIE" | "LIVRE" | "FACTURE" | "PAYE";

export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  clientId: number;
  clientName: string;
  clientContact: string;
  notes: string | null;
  subtotal: string;
  tax: string;
  total: string;
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

export async function listOrders(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  clientId?: number;
} = {}) {
  try {
    const response = await api.get<{
      data: Order[];
      pagination: Pagination;
    }>("/orders", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getOrderById(id: number) {
  try {
    const response = await api.get<{ data: { order: Order; items: OrderItem[] } }>(`/orders/${id}`);
    return { success: true as const, ...response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createOrder(input: {
  orderNumber: string;
  clientId: number;
  clientName: string;
  clientContact: string;
  status?: OrderStatus;
  notes?: string | null;
  subtotal: number;
  tax?: number;
  total: number;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}) {
  try {
    const response = await api.post<{ data: Order }>("/orders", input);
    return {
      success: true as const,
      order: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateOrder(
  id: number,
  input: Partial<{
    orderNumber: string;
    clientId: number;
    clientName: string;
    clientContact: string;
    status: OrderStatus;
    notes: string | null;
    subtotal: number;
    tax: number;
    total: number;
    items: {
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }[];
  }>
) {
  try {
    const response = await api.put<{ data: Order }>(`/orders/${id}`, input);
    return {
      success: true as const,
      order: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function deleteOrder(id: number) {
  try {
    await api.delete(`/orders/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
