// backend/src/validators/profitability.validator.ts

import { z } from 'zod';

export const profitabilityQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  animalId: z.coerce.number().optional(),
});

export type ProfitabilityQuery = z.infer<typeof profitabilityQuerySchema>;