import { z } from "zod";

export const FATTENING_STATUSES = ["ACTIVE", "COMPLETED", "CANCELLED"] as const;

export const createFatteningBatchSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(120),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
  animalCount: z.coerce.number().int().positive("Le nombre d'animaux doit être positif."),
  initialAverageWeight: z.coerce.number().positive("Le poids initial doit être positif."),
  targetWeight: z.coerce.number().positive("Le poids cible doit être positif."),
  targetDailyGmq: z.coerce.number().positive().optional().nullable(),
  estimatedEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional()
    .nullable(),
  exploitationId: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().max(255).optional().nullable(),
});

export const updateFatteningBatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),
  animalCount: z.coerce.number().int().positive().optional(),
  initialAverageWeight: z.coerce.number().positive().optional(),
  targetWeight: z.coerce.number().positive().optional(),
  targetDailyGmq: z.coerce.number().positive().optional().nullable(),
  estimatedEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional()
    .nullable(),
  status: z.enum(FATTENING_STATUSES).optional(),
  exploitationId: z.coerce.number().int().positive().optional().nullable(),
  notes: z.string().max(255).optional().nullable(),
});

export const listFatteningBatchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(FATTENING_STATUSES).optional(),
  exploitationId: z.coerce.number().int().positive().optional(),
});
