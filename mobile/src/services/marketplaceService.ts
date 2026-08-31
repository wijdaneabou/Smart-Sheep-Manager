import api from "./api";

export type ListingStatus = "DRAFT" | "PUBLISHED" | "SOLD" | "ARCHIVED";

export type MarketplaceListing = {
  id: number;
  animalId: number | null;
  sellerId: number;
  sellerName: string;
  title: string;
  description: string | null;
  price: string;
  currency: string;
  location: string | null;
  status: ListingStatus;
  photos: string | null;
  specifications: string | null;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MarketplaceMessage = {
  id: number;
  listingId: number;
  senderId: number;
  receiverId: number;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export type MarketplaceRating = {
  id: number;
  listingId: number;
  raterId: number;
  ratedUserId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type TransactionStatus = "PENDING" | "ESCROW" | "PAID" | "COMPLETED" | "CANCELLED";

export type MarketplaceTransaction = {
  id: number;
  listingId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  status: TransactionStatus;
  escrowReference: string | null;
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

export async function listListings(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: ListingStatus;
  sellerId?: number;
} = {}) {
  try {
    const response = await api.get<{
      data: MarketplaceListing[];
      pagination: Pagination;
    }>("/marketplace/listings", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function getListing(id: number) {
  try {
    const response = await api.get<{ data: MarketplaceListing }>(`/marketplace/listings/${id}`);
    return { success: true as const, listing: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function createListing(input: {
  animalId?: number | null;
  sellerId: number;
  sellerName: string;
  title: string;
  description?: string | null;
  price: string;
  currency?: string;
  location?: string | null;
  status?: ListingStatus;
  photos?: string | null;
  specifications?: string | null;
}) {
  try {
    const response = await api.post<{ data: MarketplaceListing }>("/marketplace/listings", input);
    return {
      success: true as const,
      listing: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateListing(
  id: number,
  input: Partial<{
    animalId: number | null;
    sellerId: number;
    sellerName: string;
    title: string;
    description: string | null;
    price: string;
    currency: string;
    location: string | null;
    status: ListingStatus;
    photos: string | null;
    specifications: string | null;
  }>
) {
  try {
    const response = await api.put<{ data: MarketplaceListing }>(`/marketplace/listings/${id}`, input);
    return {
      success: true as const,
      listing: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function deleteListing(id: number) {
  try {
    await api.delete(`/marketplace/listings/${id}`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listMessages(params: {
  listingId: number;
  page?: number;
  limit?: number;
  userId?: number;
}) {
  try {
    const response = await api.get<{
      data: MarketplaceMessage[];
      pagination: Pagination;
    }>("/marketplace/messages", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function sendMessage(input: {
  listingId: number;
  senderId: number;
  receiverId: number;
  message: string;
}) {
  try {
    const response = await api.post<{ data: MarketplaceMessage }>("/marketplace/messages", input);
    return {
      success: true as const,
      message: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function markMessageRead(id: number) {
  try {
    await api.patch(`/marketplace/messages/${id}/read`);
    return { success: true as const };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function listRatings(params: {
  listingId?: number;
  ratedUserId?: number;
  page?: number;
  limit?: number;
}) {
  try {
    const response = await api.get<{
      data: MarketplaceRating[];
      pagination: Pagination;
    }>("/marketplace/ratings", { params });
    return { success: true as const, ...response.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}

export async function submitRating(input: {
  listingId: number;
  raterId: number;
  ratedUserId: number;
  rating: number;
  comment?: string | null;
}) {
  try {
    const response = await api.post<{ data: MarketplaceRating }>("/marketplace/ratings", input);
    return {
      success: true as const,
      rating: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function createTransaction(input: {
  listingId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  status?: TransactionStatus;
  escrowReference?: string | null;
}) {
  try {
    const response = await api.post<{ data: MarketplaceTransaction }>("/marketplace/transactions", input);
    return {
      success: true as const,
      transaction: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function updateTransaction(
  id: number,
  input: Partial<{
    amount: string;
    status: TransactionStatus;
    escrowReference: string | null;
  }>
) {
  try {
    const response = await api.put<{ data: MarketplaceTransaction }>(`/marketplace/transactions/${id}`, input);
    return {
      success: true as const,
      transaction: response.data.data,
    };
  } catch (err: any) {
    return {
      success: false as const,
      message: extractError(err),
    };
  }
}

export async function getTransaction(id: number) {
  try {
    const response = await api.get<{ data: MarketplaceTransaction }>(`/marketplace/transactions/${id}`);
    return { success: true as const, transaction: response.data.data };
  } catch (err: any) {
    return { success: false as const, message: extractError(err) };
  }
}
