import {
  createListing as createListingInDb,
  updateListing as updateListingInDb,
  findListingById,
  deleteListing as deleteListingInDb,
  listListings as listListingsInDb,
  incrementListingViews as incrementListingViewsInDb,
  createMessage as createMessageInDb,
  listMessages as listMessagesInDb,
  markMessageAsRead as markMessageAsReadInDb,
  findMessageById,
  createRating as createRatingInDb,
  listRatings as listRatingsInDb,
  createTransaction as createTransactionInDb,
  updateTransaction as updateTransactionInDb,
  findTransactionById,
} from "../repositories/marketplace.repository.js";

export type CreateListingResult =
  | {
      success: true;
      status: 201;
      listing: NonNullable<Awaited<ReturnType<typeof findListingById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createListing(input: {
  animalId?: number | null;
  sellerId: number;
  sellerName: string;
  title: string;
  description?: string | null;
  price: string;
  currency?: string;
  location?: string | null;
  status?: "DRAFT" | "PUBLISHED" | "SOLD" | "ARCHIVED";
  photos?: string | null;
  specifications?: string | null;
}): Promise<CreateListingResult> {
  const listing = await createListingInDb({
    animalId: input.animalId ?? undefined,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    title: input.title,
    description: input.description ?? undefined,
    price: input.price,
    currency: input.currency ?? "MAD",
    location: input.location ?? undefined,
    status: input.status ?? "DRAFT",
    photos: input.photos ?? undefined,
    specifications: input.specifications ?? undefined,
  });

  if (!listing) {
    return { success: false, status: 400, message: "Erreur lors de la création de l'annonce." };
  }

  return { success: true, status: 201, listing };
}

export type UpdateListingResult =
  | {
      success: true;
      status: 200;
      listing: NonNullable<Awaited<ReturnType<typeof findListingById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateListing(
  id: number,
  input: {
    animalId?: number | null;
    sellerId?: number;
    sellerName?: string;
    title?: string;
    description?: string | null;
    price?: string;
    currency?: string;
    location?: string | null;
    status?: "DRAFT" | "PUBLISHED" | "SOLD" | "ARCHIVED";
    photos?: string | null;
    specifications?: string | null;
  }
): Promise<UpdateListingResult> {
  const existing = await findListingById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Annonce introuvable." };
  }

  const updated = await updateListingInDb(id, {
    animalId: input.animalId,
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    title: input.title,
    description: input.description,
    price: input.price,
    currency: input.currency,
    location: input.location,
    status: input.status,
    photos: input.photos,
    specifications: input.specifications,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Annonce introuvable." };
  }

  return { success: true, status: 200, listing: updated };
}

export async function getListing(id: number) {
  const listing = await findListingById(id);
  if (!listing) {
    return { success: false as const, status: 404 as const, message: "Annonce introuvable." };
  }
  await incrementListingViewsInDb(id);
  return { success: true as const, status: 200 as const, listing };
}

export async function deleteListing(id: number) {
  const existing = await findListingById(id);
  if (!existing) {
    return { success: false as const, status: 404 as const, message: "Annonce introuvable." };
  }
  await deleteListingInDb(id);
  return { success: true as const, status: 200 as const, message: "Annonce supprimée." };
}

export async function searchListings(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sellerId?: number;
}) {
  const { rows, total } = await listListingsInDb(params);
  return {
    success: true,
    status: 200,
    listings: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type SendMessageResult =
  | {
      success: true;
      status: 201;
      message: NonNullable<Awaited<ReturnType<typeof findMessageById>>>;
    }
  | { success: false; status: 400; message: string };

export async function sendMessage(input: {
  listingId: number;
  senderId: number;
  receiverId: number;
  message: string;
}): Promise<SendMessageResult> {
  const msg = await createMessageInDb({
    listingId: input.listingId,
    senderId: input.senderId,
    receiverId: input.receiverId,
    message: input.message,
  });
  return { success: true, status: 201, message: msg };
}

export async function getMessages(params: {
  listingId: number;
  page: number;
  limit: number;
  userId?: number;
}) {
  const { rows, total } = await listMessagesInDb(params);
  return {
    success: true,
    status: 200,
    messages: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export async function markMessageRead(id: number) {
  await markMessageAsReadInDb(id);
  return { success: true, status: 200 };
}

export type SubmitRatingResult =
  | {
      success: true;
      status: 201;
      rating: NonNullable<Awaited<ReturnType<typeof createRatingInDb>>>;
    }
  | { success: false; status: 400; message: string };

export async function submitRating(input: {
  listingId: number;
  raterId: number;
  ratedUserId: number;
  rating: number;
  comment?: string | null;
}): Promise<SubmitRatingResult> {
  const rating = await createRatingInDb({
    listingId: input.listingId,
    raterId: input.raterId,
    ratedUserId: input.ratedUserId,
    rating: input.rating,
    comment: input.comment ?? undefined,
  });
  return { success: true, status: 201, rating };
}

export async function getRatings(params: {
  listingId?: number;
  ratedUserId?: number;
  page: number;
  limit: number;
}) {
  const { rows, total } = await listRatingsInDb(params);
  return {
    success: true,
    status: 200,
    ratings: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type CreateTransactionResult =
  | {
      success: true;
      status: 201;
      transaction: NonNullable<Awaited<ReturnType<typeof findTransactionById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createTransaction(input: {
  listingId: number;
  buyerId: number;
  sellerId: number;
  amount: string;
  status?: "PENDING" | "ESCROW" | "PAID" | "COMPLETED" | "CANCELLED";
  escrowReference?: string | null;
}): Promise<CreateTransactionResult> {
  const transaction = await createTransactionInDb({
    listingId: input.listingId,
    buyerId: input.buyerId,
    sellerId: input.sellerId,
    amount: input.amount,
    status: input.status ?? "PENDING",
    escrowReference: input.escrowReference ?? undefined,
  });
  return { success: true, status: 201, transaction };
}

export type UpdateTransactionResult =
  | {
      success: true;
      status: 200;
      transaction: NonNullable<Awaited<ReturnType<typeof findTransactionById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateTransaction(
  id: number,
  input: {
    amount?: string;
    status?: "PENDING" | "ESCROW" | "PAID" | "COMPLETED" | "CANCELLED";
    escrowReference?: string | null;
  }
): Promise<UpdateTransactionResult> {
  const existing = await findTransactionById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Transaction introuvable." };
  }

  const updated = await updateTransactionInDb(id, {
    amount: input.amount,
    status: input.status,
    escrowReference: input.escrowReference,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Transaction introuvable." };
  }

  return { success: true, status: 200, transaction: updated };
}

export type GetTransactionResult =
  | {
      success: true;
      status: 200;
      transaction: NonNullable<Awaited<ReturnType<typeof findTransactionById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getTransaction(id: number): Promise<GetTransactionResult> {
  const transaction = await findTransactionById(id);
  if (!transaction) {
    return { success: false, status: 404, message: "Transaction introuvable." };
  }
  return { success: true, status: 200, transaction };
}
