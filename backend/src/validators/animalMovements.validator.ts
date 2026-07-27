import { z } from "zod";

export const MOVEMENT_TYPES = ["ENTRY", "EXIT", "DEATH", "SALE", "PURCHASE"] as const;

export const createMovementSchema = z.object({
  animalId: z.number().int().positive(),
  type: z.enum(MOVEMENT_TYPES),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)."),
  reason: z.string().min(1).max(500).optional(),
  sourceDestination: z.string().min(1).max(200).optional(),
  price: z.number().positive().optional(),
});

export const listMovementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  animalId: z.coerce.number().int().positive().optional(),
  type: z.enum(MOVEMENT_TYPES).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),
});
