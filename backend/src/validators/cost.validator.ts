// backend/src/validators/cost.validator.ts

import { z } from 'zod';

export const costQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export type CostQuery = z.infer<typeof costQuerySchema>;