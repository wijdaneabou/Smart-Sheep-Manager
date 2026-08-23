import { z } from "zod";

export const SEGMENT_TYPES = ["VIP", "REGULAR", "OCCASIONAL"] as const;

export const createClientSegmentSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(60),
  description: z.string().optional().nullable(),
  minScore: z.coerce.number().int().nonnegative().default(0),
  maxScore: z.coerce.number().int().nonnegative().default(100),
  minFrequency: z.coerce.number().int().nonnegative().default(0),
  maxFrequency: z.coerce.number().int().nonnegative().optional(),
  minBasket: z.coerce.number().nonnegative().default(0),
  maxBasket: z.coerce.number().nonnegative().optional(),
  color: z.string().max(20).default("#15803D"),
  isActive: z.boolean().default(true),
});

export const updateClientSegmentSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  description: z.string().optional().nullable(),
  minScore: z.coerce.number().int().nonnegative().optional(),
  maxScore: z.coerce.number().int().nonnegative().optional(),
  minFrequency: z.coerce.number().int().nonnegative().optional(),
  maxFrequency: z.coerce.number().int().nonnegative().optional(),
  minBasket: z.coerce.number().nonnegative().optional(),
  maxBasket: z.coerce.number().nonnegative().optional(),
  color: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
});

export const listClientSegmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  active: z.coerce.boolean().optional(),
});
