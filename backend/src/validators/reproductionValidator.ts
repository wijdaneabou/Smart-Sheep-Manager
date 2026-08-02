import { z } from 'zod';

export const createReproductionCycleSchema = z.object({
  animalId: z.number().int().positive('animalId doit être un entier positif'),
  heatDate: z.string().date('Format de date invalide (YYYY-MM-DD)'),
  matingType: z.enum(['natural', 'ai']),  // ✅ Correction : un seul argument
  maleId: z.number().int().positive().optional().nullable(),
  semenReference: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updatePregnancyConfirmationSchema = z.object({
  confirmationDate: z.string().date('Format de date invalide (YYYY-MM-DD)'),
});

export type CreateReproductionCycleInput = z.infer<typeof createReproductionCycleSchema>;
export type UpdatePregnancyConfirmationInput = z.infer<typeof updatePregnancyConfirmationSchema>;