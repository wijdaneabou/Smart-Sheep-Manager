import { z } from "zod";

export const ACTIVITY_TYPES = ["REST", "MOVEMENT", "GRAZING"] as const;

export const createSensorDataSchema = z.object({
  // ⚠️ shieldId est retiré du body car il est récupéré via la clé API (X-API-Key)
  temperature: z
    .coerce
    .number()
    .min(36, "La température minimale est 36°C.")
    .max(41, "La température maximale est 41°C.")
    .optional()
    .nullable(),
  activity: z.enum(ACTIVITY_TYPES).optional().nullable(),
  latitude: z
    .coerce
    .number()
    .min(-90, "La latitude doit être entre -90 et 90.")
    .max(90, "La latitude doit être entre -90 et 90.")
    .optional()
    .nullable(),
  longitude: z
    .coerce
    .number()
    .min(-180, "La longitude doit être entre -180 et 180.")
    .max(180, "La longitude doit être entre -180 et 180.")
    .optional()
    .nullable(),
  measuredAt: z.coerce.date().optional(),
});

export const listSensorDataQuerySchema = z.object({
  shieldId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
  since: z.coerce.date().optional(),
});