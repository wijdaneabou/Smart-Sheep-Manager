import { z } from "zod";

export const createWeightRecordSchema = z.object({
  fatteningBatchId: z.coerce.number().int().positive(),
  averageWeight: z.coerce.number().positive("Le poids moyen doit être positif."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
  note: z.string().max(500).optional().nullable(),
});

export const listWeightRecordsQuerySchema = z.object({
  batchId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(200).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});
