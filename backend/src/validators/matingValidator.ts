import { z } from 'zod';

export const createMatingServiceSchema = z.object({
  animalId: z.number().int().positive(),
  cycleId: z.number().int().positive().optional().nullable(),
  serviceDate: z.string().date(),
  type: z.enum(['natural', 'ai']),
  maleId: z.number().int().positive().optional().nullable(),
  semenReference: z.string().max(100).optional().nullable(),
  result: z.enum(['success', 'failure', 'pending']).optional().default('pending'),
  notes: z.string().optional().nullable(),
});

export const updateMatingServiceSchema = z.object({
  serviceDate: z.string().date().optional(),
  maleId: z.number().int().positive().optional().nullable(),
  semenReference: z.string().max(100).optional().nullable(),
  result: z.enum(['success', 'failure', 'pending']).optional(),
  notes: z.string().optional().nullable(),
});

export type CreateMatingServiceInput = z.infer<typeof createMatingServiceSchema>;
export type UpdateMatingServiceInput = z.infer<typeof updateMatingServiceSchema>;