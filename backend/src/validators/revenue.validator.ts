// backend/src/validators/revenue.validator.ts

import { z } from 'zod';
import { revenueTypes, revenueStatuses } from '../db/schema/revenues.js';

export const createRevenueSchema = z.object({
  exploitationId: z.number().positive(),
  date: z.string().datetime().optional(),
  type: z.enum(revenueTypes),
  quantity: z.number().min(0).optional().nullable(),
  unitPrice: z.number().min(0).optional().nullable(),
  totalHT: z.number().min(0),
  totalTTC: z.number().min(0),
  buyer: z.string().max(255).optional().nullable(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'OTHER']).default('CASH'),
  status: z.enum(revenueStatuses).default('PENDING'),
  notes: z.string().optional().nullable(),
});

export const updateRevenueSchema = createRevenueSchema.partial();