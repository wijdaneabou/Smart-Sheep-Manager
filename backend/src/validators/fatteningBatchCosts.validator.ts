import { z } from "zod";

export const FATTENING_COST_CATEGORIES = [
  "FEED",
  "LABOR",
  "VETERINARY",
  "MEDICINE",
  "TRANSPORT",
  "OTHER",
] as const;

export const createFatteningBatchCostSchema = z.object({
  fatteningBatchId: z.coerce.number().int().positive(),
  category: z.enum(FATTENING_COST_CATEGORIES, {
    error: "Catégorie invalide.",
  }),
  description: z.string().max(255).optional().nullable(),
  amount: z.coerce.number().positive("Le montant doit être positif."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
});

export const updateFatteningBatchCostSchema = z.object({
  category: z.enum(FATTENING_COST_CATEGORIES).optional(),
  description: z.string().max(255).optional().nullable(),
  amount: z.coerce.number().positive("Le montant doit être positif.").optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),
});

export const listFatteningBatchCostsQuerySchema = z.object({
  batchId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(200).default(200),
  offset: z.coerce.number().int().nonnegative().default(0),
});
