import { z } from "zod";

export const LISTING_STATUSES = ["DRAFT", "PUBLISHED", "SOLD", "ARCHIVED"] as const;

export const createListingSchema = z.object({
  animalId: z.coerce.number().int().positive().optional().nullable(),
  sellerId: z.coerce.number().int().positive(),
  sellerName: z.string().min(1).max(120),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  price: z.string().min(1).max(50),
  currency: z.string().default("MAD"),
  location: z.string().optional().nullable(),
  status: z.enum(LISTING_STATUSES).default("DRAFT"),
  photos: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
});

export const updateListingSchema = z.object({
  animalId: z.coerce.number().int().positive().optional().nullable(),
  sellerId: z.coerce.number().int().positive().optional(),
  sellerName: z.string().min(1).max(120).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  price: z.string().min(1).max(50).optional(),
  currency: z.string().optional(),
  location: z.string().optional().nullable(),
  status: z.enum(LISTING_STATUSES).optional(),
  photos: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
});

export const listListingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(LISTING_STATUSES).optional(),
  sellerId: z.coerce.number().int().positive().optional(),
});

export const createMessageSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  senderId: z.coerce.number().int().positive(),
  receiverId: z.coerce.number().int().positive(),
  message: z.string().min(1),
});

export const listMessagesQuerySchema = z.object({
  listingId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  userId: z.coerce.number().int().positive().optional(),
});

export const createRatingSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  raterId: z.coerce.number().int().positive(),
  ratedUserId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional().nullable(),
});

export const listRatingsQuerySchema = z.object({
  listingId: z.coerce.number().int().positive().optional(),
  ratedUserId: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const TRANSACTION_STATUSES = ["PENDING", "ESCROW", "PAID", "COMPLETED", "CANCELLED"] as const;

export const createTransactionSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  buyerId: z.coerce.number().int().positive(),
  sellerId: z.coerce.number().int().positive(),
  amount: z.string().min(1).max(50),
  status: z.enum(TRANSACTION_STATUSES).default("PENDING"),
  escrowReference: z.string().optional().nullable(),
});

export const updateTransactionSchema = z.object({
  amount: z.string().min(1).max(50).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  escrowReference: z.string().optional().nullable(),
});
