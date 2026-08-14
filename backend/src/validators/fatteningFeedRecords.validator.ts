import { z } from "zod";

export const createFatteningFeedRecordSchema = z.object({
  fatteningBatchId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
  feedType: z.string().min(1, "Le type d'aliment est requis.").max(120),
  quantityKg: z.coerce.number().positive("La quantité doit être positive."),
  unitPrice: z.coerce.number().positive("Le prix unitaire doit être positif."),
  note: z.string().max(500).optional().nullable(),
});

export const updateFatteningFeedRecordSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),
  feedType: z.string().min(1).max(120).optional(),
  quantityKg: z.coerce.number().positive("La quantité doit être positive.").optional(),
  unitPrice: z.coerce.number().positive("Le prix unitaire doit être positif.").optional(),
  note: z.string().max(500).optional().nullable(),
});

export const listFatteningFeedRecordsQuerySchema = z.object({
  batchId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(200).default(200),
  offset: z.coerce.number().int().nonnegative().default(0),
});
