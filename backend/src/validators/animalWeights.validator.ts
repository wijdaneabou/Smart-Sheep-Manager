import { z } from "zod";

export const createWeightRecordSchema = z.object({
  animalId: z.number().int().positive(),
  weight: z.number().positive(),
  bcs: z.number().min(0).max(5).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
  note: z.string().min(1).max(500).optional(),
});

export const listWeightRecordsQuerySchema = z.object({
  animalId: z.coerce.number().int().positive().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),
});
