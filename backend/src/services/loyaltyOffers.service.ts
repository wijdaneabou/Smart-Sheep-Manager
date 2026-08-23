import {
  findLoyaltyOfferById,
  createLoyaltyOffer as createLoyaltyOfferInDb,
  updateLoyaltyOffer as updateLoyaltyOfferInDb,
  deleteLoyaltyOffer as deleteLoyaltyOfferInDb,
  listLoyaltyOffers as listLoyaltyOffersInDb,
} from "../repositories/loyalty.repository.js";

export type CreateLoyaltyOfferResult =
  | {
      success: true;
      status: 201;
      offer: NonNullable<Awaited<ReturnType<typeof findLoyaltyOfferById>>>;
    }
  | { success: false; status: 400; message: string };

export async function createLoyaltyOffer(input: {
  title: string;
  description?: string | null;
  type: "VOLUME_DISCOUNT" | "TARGETED_OFFER";
  segmentId?: number | null;
  minQuantity?: number;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  validFrom: Date;
  validTo: Date;
  isActive?: boolean;
}): Promise<CreateLoyaltyOfferResult> {
  const offer = await createLoyaltyOfferInDb({
    title: input.title,
    description: input.description ?? undefined,
    type: input.type,
    segmentId: input.segmentId ?? undefined,
    minQuantity: input.minQuantity ?? 1,
    discountPercentage: input.discountPercentage != null ? String(input.discountPercentage) : undefined,
    discountAmount: input.discountAmount != null ? String(input.discountAmount) : undefined,
    validFrom: input.validFrom,
    validTo: input.validTo,
    isActive: input.isActive ?? true,
  });
  if (!offer) {
    return { success: false, status: 400, message: "Erreur lors de la création de l'offre." };
  }
  return { success: true, status: 201, offer };
}

export type UpdateLoyaltyOfferResult =
  | {
      success: true;
      status: 200;
      offer: NonNullable<Awaited<ReturnType<typeof findLoyaltyOfferById>>>;
    }
  | { success: false; status: 400 | 404; message: string };

export async function updateLoyaltyOffer(
  id: number,
  input: {
    title?: string;
    description?: string | null;
    type?: "VOLUME_DISCOUNT" | "TARGETED_OFFER";
    segmentId?: number | null;
    minQuantity?: number;
    discountPercentage?: number | null;
    discountAmount?: number | null;
    validFrom?: Date;
    validTo?: Date;
    isActive?: boolean;
  }
): Promise<UpdateLoyaltyOfferResult> {
  const existing = await findLoyaltyOfferById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Offre introuvable." };
  }

  const updated = await updateLoyaltyOfferInDb(id, {
    title: input.title,
    description: input.description,
    type: input.type,
    segmentId: input.segmentId,
    minQuantity: input.minQuantity,
    discountPercentage: input.discountPercentage != null ? String(input.discountPercentage) : undefined,
    discountAmount: input.discountAmount != null ? String(input.discountAmount) : undefined,
    validFrom: input.validFrom,
    validTo: input.validTo,
    isActive: input.isActive,
  });

  if (!updated) {
    return { success: false, status: 404, message: "Offre introuvable." };
  }
  return { success: true, status: 200, offer: updated };
}

export type GetLoyaltyOfferResult =
  | {
      success: true;
      status: 200;
      offer: NonNullable<Awaited<ReturnType<typeof findLoyaltyOfferById>>>;
    }
  | { success: false; status: 404; message: string };

export async function getLoyaltyOfferById(id: number): Promise<GetLoyaltyOfferResult> {
  const offer = await findLoyaltyOfferById(id);
  if (!offer) {
    return { success: false, status: 404, message: "Offre introuvable." };
  }
  return { success: true, status: 200, offer };
}

export async function listLoyaltyOffers(params: {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  segmentId?: number;
  active?: boolean;
}) {
  const { rows, total } = await listLoyaltyOffersInDb(params);
  return {
    success: true,
    status: 200,
    offers: rows,
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}

export type DeleteLoyaltyOfferResult =
  | {
      success: true;
      status: 200;
      message: string;
    }
  | { success: false; status: 404; message: string };

export async function deleteLoyaltyOffer(id: number): Promise<DeleteLoyaltyOfferResult> {
  const existing = await findLoyaltyOfferById(id);
  if (!existing) {
    return { success: false, status: 404, message: "Offre introuvable." };
  }
  await deleteLoyaltyOfferInDb(id);
  return { success: true, status: 200, message: "Offre supprimée." };
}
