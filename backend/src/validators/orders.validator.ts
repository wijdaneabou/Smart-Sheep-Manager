import { z } from "zod";

export const ORDER_STATUSES = ["BROUILLON", "ENVOYE", "VALIDE", "EN_PREPARATION", "EXPEDIE", "LIVRE", "FACTURE", "PAYE"] as const;

export const createOrderSchema = z.object({
  orderNumber: z.string().min(1, "Le numéro de commande est requis.").max(50),
  clientId: z.coerce.number().int().positive("Le client est requis."),
  clientName: z.string().min(1, "Le nom du client est requis.").max(120),
  clientContact: z.string().min(1, "Le contact du client est requis.").max(255),
  status: z.enum(ORDER_STATUSES).default("BROUILLON"),
  notes: z.string().optional().nullable(),
  subtotal: z.coerce.number().nonnegative("Le sous-total doit être positif."),
  tax: z.coerce.number().nonnegative().default(0),
  total: z.coerce.number().nonnegative("Le total doit être positif."),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        productName: z.string().min(1).max(120),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().positive(),
        totalPrice: z.coerce.number().nonnegative(),
      })
    )
    .min(1, "Au moins un article est requis."),
});

export const updateOrderSchema = z.object({
  orderNumber: z.string().min(1).max(50).optional(),
  clientId: z.coerce.number().int().positive().optional(),
  clientName: z.string().min(1).max(120).optional(),
  clientContact: z.string().min(1).max(255).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  notes: z.string().optional().nullable(),
  subtotal: z.coerce.number().nonnegative().optional(),
  tax: z.coerce.number().nonnegative().optional(),
  total: z.coerce.number().nonnegative().optional(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        productName: z.string().min(1).max(120),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().positive(),
        totalPrice: z.coerce.number().nonnegative(),
      })
    )
    .optional(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  clientId: z.coerce.number().int().positive().optional(),
});
