import api from "./api";

export type Segment = {
  id: number;
  name: string;
  description: string | null;
  minScore: number;
  maxScore: number;
  minFrequency: number;
  maxFrequency: number | null;
  minBasket: string;
  maxBasket: string | null;
  color: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyProfile = {
  id: number;
  clientId: number;
  score: number;
  purchaseFrequency: number;
  averageBasket: string;
  totalPurchases: number;
  totalSpent: string;
  lastPurchaseAt: string | null;
  segmentId: number | null;
  autoSegment: boolean;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    name: string;
    contact: string;
    type: string;
  };
};

export type OfferType = "VOLUME_DISCOUNT" | "TARGETED_OFFER";

export type LoyaltyOffer = {
  id: number;
  title: string;
  description: string | null;
  type: OfferType;
  segmentId: number | null;
  minQuantity: number;
  discountPercentage: string | null;
  discountAmount: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationType = "AVAILABILITY" | "PRICE_DROP" | "NEW_ARRIVAL";

export type LoyaltyNotification = {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  clientId: number | null;
  segmentId: number | null;
  isRead: boolean;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export async function listSegments(params: {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
} = {}) {
  try {
    const response = await api.get<{ data: Segment[]; pagination: any }>("/crm/segments", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createSegment(input: {
  name: string;
  description?: string | null;
  minScore?: number;
  maxScore?: number;
  minFrequency?: number;
  maxFrequency?: number | null;
  minBasket?: number;
  maxBasket?: number | null;
  color?: string;
  isActive?: boolean;
}) {
  try {
    const response = await api.post<{ data: Segment }>("/crm/segments", input);
    return { success: true as const, segment: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function updateSegment(id: number, input: Partial<Segment>) {
  try {
    const response = await api.put<{ data: Segment }>(`/crm/segments/${id}`, input);
    return { success: true as const, segment: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteSegment(id: number) {
  try {
    await api.delete(`/crm/segments/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getSegmentById(id: number) {
  try {
    const response = await api.get<{ data: Segment }>(`/crm/segments/${id}`);
    return { success: true as const, segment: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listOffers(params: {
  page?: number;
  limit?: number;
  search?: string;
  type?: OfferType;
  segmentId?: number;
  active?: boolean;
} = {}) {
  try {
    const response = await api.get<{ data: LoyaltyOffer[]; pagination: any }>("/crm/offers", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createOffer(input: {
  title: string;
  description?: string | null;
  type: OfferType;
  segmentId?: number | null;
  minQuantity?: number;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  validFrom: string;
  validTo: string;
  isActive?: boolean;
}) {
  try {
    const response = await api.post<{ data: LoyaltyOffer }>("/crm/offers", input);
    return { success: true as const, offer: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function updateOffer(id: number, input: {
  title?: string;
  description?: string | null;
  type?: OfferType;
  segmentId?: number | null;
  minQuantity?: number;
  discountPercentage?: number | string | null;
  discountAmount?: number | string | null;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}) {
  try {
    const response = await api.put<{ data: LoyaltyOffer }>(`/crm/offers/${id}`, input);
    return { success: true as const, offer: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function deleteOffer(id: number) {
  try {
    await api.delete(`/crm/offers/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getOfferById(id: number) {
  try {
    const response = await api.get<{ data: LoyaltyOffer }>(`/crm/offers/${id}`);
    return { success: true as const, offer: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listNotifications(params: {
  page?: number;
  limit?: number;
  type?: NotificationType;
  clientId?: number;
  segmentId?: number;
  unreadOnly?: boolean;
} = {}) {
  try {
    const response = await api.get<{ data: LoyaltyNotification[]; pagination: any }>("/crm/notifications", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createNotification(input: {
  title: string;
  message: string;
  type: NotificationType;
  clientId?: number | null;
  segmentId?: number | null;
}) {
  try {
    const response = await api.post<{ data: LoyaltyNotification }>("/crm/notifications", input);
    return { success: true as const, notification: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function markNotificationRead(id: number) {
  try {
    const response = await api.patch<{ data: LoyaltyNotification }>(`/crm/notifications/${id}/read`, {});
    return { success: true as const, notification: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listProfiles(params: {
  page?: number;
  limit?: number;
  search?: string;
  segmentId?: number;
} = {}) {
  try {
    const response = await api.get<{ data: LoyaltyProfile[]; pagination: any }>("/crm/profiles", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
