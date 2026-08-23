import { z } from "zod";

export const DELIVERY_STATUSES = ["EN_ATTENTE", "EN_COURS", "LIVRE"] as const;

export const createDeliverySchema = z.object({
  deliveryNumber: z.string().min(1, "Le numéro de livraison est requis.").max(50),
  status: z.enum(DELIVERY_STATUSES).default("EN_ATTENTE"),
  deliveryDate: z.string().min(1, "La date de livraison est requise.").max(20),
  address: z.string().min(1, "L'adresse est requise.").max(255),
  carrier: z.string().min(1, "Le transporteur est requis.").max(120),
  trackingNumber: z.string().min(1, "Le numéro de suivi est requis.").max(120),
  deliveryNote: z.string().optional().nullable(),
  clientId: z.coerce.number().int().positive().optional().nullable(),
  clientName: z.string().min(1, "Le nom du client est requis.").max(120),
  clientContact: z.string().min(1, "Le contact du client est requis.").max(255),
  notes: z.string().optional().nullable(),
});

export const updateDeliverySchema = z.object({
  deliveryNumber: z.string().min(1).max(50).optional(),
  status: z.enum(DELIVERY_STATUSES).optional(),
  deliveryDate: z.string().min(1).max(20).optional(),
  address: z.string().min(1).max(255).optional(),
  carrier: z.string().min(1).max(120).optional(),
  trackingNumber: z.string().min(1).max(120).optional(),
  deliveryNote: z.string().optional().nullable(),
  clientId: z.coerce.number().int().positive().optional().nullable(),
  clientName: z.string().min(1).max(120).optional(),
  clientContact: z.string().min(1).max(255).optional(),
  notes: z.string().optional().nullable(),
});

export const listDeliveriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(DELIVERY_STATUSES).optional(),
});
