import { z } from "zod";

const BATIMENT_TYPES = ["BERGERIE", "STABULATION", "BOX", "PARC", "PARCELLE"] as const;
const BATIMENT_ETATS = ["BON", "MOYEN", "MAUVAIS"] as const;

export const createBatimentSchema = z.object({
  exploitationId: z.number().int().positive(),
  name: z.string().min(2).max(150),
  type: z.enum(BATIMENT_TYPES),
  capacite: z.number().int().nonnegative().optional(),
  superficie: z.number().positive().optional(),
  equipements: z.array(z.string()).optional(),
  etat: z.enum(BATIMENT_ETATS).default("BON"),
  occupationActuelle: z.number().int().nonnegative().default(0),
});

export const updateBatimentSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  type: z.enum(BATIMENT_TYPES).optional(),
  capacite: z.number().int().nonnegative().optional(),
  superficie: z.number().positive().optional(),
  equipements: z.array(z.string()).optional(),
  etat: z.enum(BATIMENT_ETATS).optional(),
  occupationActuelle: z.number().int().nonnegative().optional(),
});

export const listBatimentsQuerySchema = z.object({
  exploitationId: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  type: z.enum(BATIMENT_TYPES).optional(),
});