// backend/src/validators/cashflow.validator.ts

import { z } from 'zod';

export const cashflowQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  months: z.coerce.number().int().min(1).max(12).optional().default(3),
});

export type CashflowQuery = z.infer<typeof cashflowQuerySchema>;