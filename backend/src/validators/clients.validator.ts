import { z } from "zod";

export const CLIENT_TYPES = ["ACHETEUR", "BOUCHER", "GROSSISTE", "COOPERATIVE"] as const;

export const createClientSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(120),
  contact: z.string().min(1, "Le contact est requis.").max(255),
  type: z.enum(CLIENT_TYPES),
  purchaseHistory: z.string().optional().nullable(),
  preferences: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  contact: z.string().min(1).max(255).optional(),
  type: z.enum(CLIENT_TYPES).optional(),
  purchaseHistory: z.string().optional().nullable(),
  preferences: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  type: z.enum(CLIENT_TYPES).optional(),
});
