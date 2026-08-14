import { z } from "zod";

export const batchPerformanceComparisonQuerySchema = z.object({
  exploitationId: z.coerce.number().int().positive().optional(),
  onlyCompleted: z.coerce.boolean().optional().default(false),
});
