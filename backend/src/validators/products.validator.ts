import { z } from "zod";

export const PRODUCT_CATEGORIES = ["AGNEAUX", "MOUTONS", "LAINE", "VIANDE", "AUTRE"] as const;
export const PRODUCT_AVAILABILITIES = ["DISPONIBLE", "LIMITE", "RUPTURE"] as const;

export const createProductSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(120),
  category: z.enum(PRODUCT_CATEGORIES),
  description: z.string().min(1, "La description est requise."),
  price: z.coerce.number().positive("Le prix doit être positif."),
  availability: z.enum(PRODUCT_AVAILABILITIES).default("DISPONIBLE"),
  photos: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  description: z.string().min(1).optional(),
  price: z.coerce.number().positive().optional(),
  availability: z.enum(PRODUCT_AVAILABILITIES).optional(),
  photos: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
});

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  availability: z.enum(PRODUCT_AVAILABILITIES).optional(),
});
