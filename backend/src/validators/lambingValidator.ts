import { z } from 'zod';

export const lambingSchema = z.object({
  lambingDate: z.string().date(),
  lambingType: z.enum(['single', 'multiple']),
  liveBorn: z.number().int().min(0),
  stillBorn: z.number().int().min(0),
  lambs: z.array(
    z.object({
      sex: z.enum(['MALE', 'FEMALE']),
      weight: z.number().positive().optional(),
      birthDate: z.string().date().optional(), // si non fourni, on prend lambingDate
      name: z.string().optional().nullable(),
    })
  ).optional(),
});

export type LambingInput = z.infer<typeof lambingSchema>;