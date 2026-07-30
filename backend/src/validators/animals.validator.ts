import { z } from "zod";

export const BREEDS = ["Sardi", "Timahdite", "D'man", "Beni-Guil"] as const;
export const SEXES = ["MALE", "FEMALE"] as const;

export const HEALTH_STATUSES = [
  "HEALTHY",
  "SICK",
  "RECOVERING",
  "DECEASED",
  "QUARANTINE",
] as const;


export const createAnimalSchema = z.object({
  rfid: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  breed: z.enum(BREEDS),
  sex: z.enum(SEXES),

  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),


  // Nouveau : RFID au lieu de ID
  fatherRfid: z.string().max(50).optional(),

  motherRfid: z.string().max(50).optional(),

  weight: z.coerce.number().positive().optional(),

  bcs: z.coerce.number().min(0).max(5).optional(),

  healthStatus: z.enum(HEALTH_STATUSES).default("HEALTHY"),

  exploitationId: z.coerce.number().int().positive().optional(),

  photoUrl: z.string().optional(),
});



export const updateAnimalSchema = z.object({
  rfid: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  breed: z.enum(BREEDS).optional(),
  sex: z.enum(SEXES).optional(),

  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD).")
    .optional(),

  // Nouveau : RFID au lieu de ID
  fatherRfid: z
    .string()
    .max(50)
    .nullable()
    .optional(),

  motherRfid: z
    .string()
    .max(50)
    .nullable()
    .optional(),

  fatherId: z
    .coerce.number()
    .int()
    .positive()
    .nullable()
    .optional(),

  motherId: z
    .coerce.number()
    .int()
    .positive()
    .nullable()
    .optional(),

  weight: z
    .coerce.number()
    .positive()
    .nullable()
    .optional(),

  bcs: z
    .coerce.number()
    .min(0)
    .max(5)
    .nullable()
    .optional(),

  healthStatus: z.enum(HEALTH_STATUSES).optional(),

  exploitationId: z
    .coerce.number()
    .int()
    .positive()
    .nullable()
    .optional(),

  photoUrl: z.string().optional(),
});


export const listAnimalsQuerySchema = z.object({

  page: z.coerce.number().int().positive().default(1),

  limit: z.coerce.number().int().positive().max(100).default(20),

  search: z.string().optional(),

  breed: z.enum(BREEDS).optional(),

  sex: z.enum(SEXES).optional(),

  healthStatus: z.enum(HEALTH_STATUSES).optional(),

});