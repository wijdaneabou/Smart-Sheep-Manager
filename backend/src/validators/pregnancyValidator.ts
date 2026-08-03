import { z } from 'zod';

export const updatePregnancySchema = z.object({
  expectedLambingDate: z.string().date().optional(),
  ultrasoundNotes: z.string().optional().nullable(),
  lambingDate: z.string().date().optional(),
  lambingType: z.enum(['single', 'multiple']).optional(),
  liveBorn: z.number().int().min(0).optional(),
  stillBorn: z.number().int().min(0).optional(),
});

export type UpdatePregnancyInput = z.infer<typeof updatePregnancySchema>;