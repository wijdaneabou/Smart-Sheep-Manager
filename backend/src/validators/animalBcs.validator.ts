import { z } from "zod";

export const createBcsRecordSchema = z.object({
  animalId: z.number().int().positive("L'ID de l'animal est requis."),
  bcsScore: z.number().min(1, "Le score BCS doit être au moins 1.0").max(5, "Le score BCS ne peut dépasser 5.0"),
  spinousProcesses: z.number().min(1).max(5).optional(),
  transverseProcesses: z.number().min(1).max(5).optional(),
  eyeMuscle: z.number().min(1).max(5).optional(),
  fatCover: z.number().min(1).max(5).optional(),
  tailDock: z.number().min(1).max(5).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
  evaluator: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  nutritionalRecommendation: z.string().max(1000).optional(),
});

export const listBcsRecordsQuerySchema = z.object({
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
