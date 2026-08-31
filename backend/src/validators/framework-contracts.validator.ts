import { z } from "zod";

export const CONTRACT_STATUSES = ["EN_NEGOCIATION", "ACTIF", "EXPIRE", "RESILIE"] as const;

export const createFrameworkContractSchema = z.object({
  contractNumber: z.string().min(1, "Le numéro de contrat est requis.").max(50),
  status: z.enum(CONTRACT_STATUSES).default("EN_NEGOCIATION"),
  clientId: z.coerce.number().int().positive("Le client est requis."),
  clientName: z.string().min(1, "Le nom du client est requis.").max(120),
  monthlyVolume: z.string().min(1, "Le volume mensuel est requis.").max(50),
  yearlyVolume: z.string().min(1, "Le volume annuel est requis.").max(50),
  negotiatedPrice: z.string().min(1, "Le prix négocié est requis.").max(50),
  startDate: z.string().min(1, "La date de début est requise.").max(20),
  endDate: z.string().min(1, "La date de fin est requise.").max(20),
  clauses: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateFrameworkContractSchema = z.object({
  contractNumber: z.string().min(1).max(50).optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  clientId: z.coerce.number().int().positive().optional(),
  clientName: z.string().min(1).max(120).optional(),
  monthlyVolume: z.string().min(1).max(50).optional(),
  yearlyVolume: z.string().min(1).max(50).optional(),
  negotiatedPrice: z.string().min(1).max(50).optional(),
  startDate: z.string().min(1).max(20).optional(),
  endDate: z.string().min(1).max(20).optional(),
  clauses: z.string().optional().nullable(),
  schedule: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const listFrameworkContractsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(CONTRACT_STATUSES).optional(),
  clientId: z.coerce.number().int().positive().optional(),
});
