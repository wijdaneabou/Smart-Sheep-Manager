/**
 * backend/src/validators/biValidators.ts
 * ------------------------------------------------------------------
 * Schémas Zod pour valider les query params des endpoints BI.
 * Tous les endpoints du module 12 partagent le même jeu de filtres :
 * exploitationId (optionnel), dateFrom, dateTo (format YYYY-MM-DD).
 * ------------------------------------------------------------------
 */

import { z } from "zod";

// Garde ces listes synchronisées avec les valeurs réellement utilisées en base
// (cf. colonnes `breed`, `sex`, `health_status` de la table `animals`).
export const BREEDS = ["Sardi", "Timahdite", "D'man", "Beni-Guil"] as const;
export const SEXES = ["MALE", "FEMALE"] as const;
export const HEALTH_STATUSES = ["HEALTHY", "SICK", "RECOVERING", "QUARANTINE"] as const;

export const biQuerySchema = z.object({
  exploitationId: z.coerce.number().int().positive().optional(),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateFrom doit être au format YYYY-MM-DD")
    .optional(),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dateTo doit être au format YYYY-MM-DD")
    .optional(),
  // ---- Filtres croisés (US-12.2) ----
  breed: z.enum(BREEDS).optional(),
  sex: z.enum(SEXES).optional(),
  healthStatus: z.enum(HEALTH_STATUSES).optional(),
  buildingId: z.coerce.number().int().positive().optional(),
  lot: z.string().optional(),
  ageMin: z.coerce.number().int().min(0).max(30).optional(),
  ageMax: z.coerce.number().int().min(0).max(30).optional(),
  granularity: z.enum(["day", "week", "month", "year"]).optional(),
});

export type BiQuery = z.infer<typeof biQuerySchema>;