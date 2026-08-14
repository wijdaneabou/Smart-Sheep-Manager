import { z } from "zod";

export const createIndividualWeightSchema = z.object({
  fatteningBatchId: z.coerce.number().int().positive(),
  animalId: z.coerce.number().int().positive().optional().nullable(),
  weight: z.coerce.number().positive("Le poids doit être positif."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
  note: z.string().max(500).optional().nullable(),
});

export const updateIndividualWeightSchema = z.object({
  animalId: z.coerce.number().int().positive().optional().nullable(),
  weight: z.coerce.number().positive("Le poids doit être positif.").optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),
  note: z.string().max(500).optional().nullable(),
});

export const listIndividualWeightsQuerySchema = z.object({
  batchId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(500).default(500),
  offset: z.coerce.number().int().nonnegative().default(0),
});
