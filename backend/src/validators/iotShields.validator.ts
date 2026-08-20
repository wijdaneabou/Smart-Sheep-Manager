import { z } from "zod";

export const SENSOR_TYPES = [
  "TEMPERATURE",
  "ACTIVITY",
  "GPS",
] as const;

export const SHIELD_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export const createIotShieldSchema = z.object({
  ssmIotNumber: z
    .string()
    .min(1, "Le numéro SSM-IOT est requis.")
    .max(50, "Le numéro SSM-IOT est trop long.")
    .regex(/^SSM-IOT-\d+$/, "Le format doit être SSM-IOT-XXXXXX."),

  sensors: z.array(z.enum(SENSOR_TYPES)).min(1, "Veuillez sélectionner au moins un capteur."),

  battery: z.coerce
    .number()
    .min(0, "La batterie doit être entre 0 et 100.")
    .max(100, "La batterie doit être entre 0 et 100.")
    .optional(),

  animalId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  status: z.enum(SHIELD_STATUSES).default("ACTIVE"),
});

export const updateIotShieldSchema = z.object({
  ssmIotNumber: z
    .string()
    .min(1, "Le numéro SSM-IOT est requis.")
    .max(50, "Le numéro SSM-IOT est trop long.")
    .regex(/^SSM-IOT-\d+$/, "Le format doit être SSM-IOT-XXXXXX.")
    .optional(),

  sensors: z.array(z.enum(SENSOR_TYPES)).optional(),

  battery: z.coerce
    .number()
    .min(0, "La batterie doit être entre 0 et 100.")
    .max(100, "La batterie doit être entre 0 et 100.")
    .optional()
    .nullable(),

  animalId: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable(),

  status: z.enum(SHIELD_STATUSES).optional(),
});

export const listIotShieldsQuerySchema = z.object({
  exploitationId: z.coerce.number().int().positive().optional(),

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(50),

  search: z.string().optional(),

  status: z.enum(SHIELD_STATUSES).optional(),
});
