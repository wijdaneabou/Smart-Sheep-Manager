import { z } from "zod";

export const OFFER_TYPES = ["VOLUME_DISCOUNT", "TARGETED_OFFER"] as const;

export const createLoyaltyOfferSchema = z.object({
  title: z.string().min(1, "Le titre est requis.").max(150),
  description: z.string().optional().nullable(),
  type: z.enum(OFFER_TYPES),
  segmentId: z.coerce.number().int().positive().optional().nullable(),
  minQuantity: z.coerce.number().int().positive().default(1),
  discountPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  discountAmount: z.coerce.number().nonnegative().optional().nullable(),
  validFrom: z.string().datetime().or(z.coerce.date()),
  validTo: z.string().datetime().or(z.coerce.date()),
  isActive: z.boolean().default(true),
});

export const updateLoyaltyOfferSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().optional().nullable(),
  type: z.enum(OFFER_TYPES).optional(),
  segmentId: z.coerce.number().int().positive().optional().nullable(),
  minQuantity: z.coerce.number().int().positive().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  discountAmount: z.coerce.number().nonnegative().optional().nullable(),
  validFrom: z.string().datetime().or(z.coerce.date()).optional(),
  validTo: z.string().datetime().or(z.coerce.date()).optional(),
  isActive: z.boolean().optional(),
});

export const listLoyaltyOffersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  type: z.enum(OFFER_TYPES).optional(),
  segmentId: z.coerce.number().int().positive().optional(),
  active: z.coerce.boolean().optional(),
});
