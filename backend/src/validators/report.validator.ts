// backend/src/validators/report.validator.ts

import { z } from 'zod';

export const reportQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const reportExportQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['csv', 'fec']).default('csv'),
});