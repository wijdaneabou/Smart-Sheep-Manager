import { z } from 'zod';

// --- Health Records (US-5.1) ---
export const createHealthRecordSchema = z.object({
  animalId: z.number().positive(),
  status: z.enum(['HEALTHY', 'SURVEILLANCE', 'SICK', 'UNDER_TREATMENT', 'RECOVERED']),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
});
export const updateHealthRecordSchema = createHealthRecordSchema.partial();

// --- Treatments (US-5.2) ---
export const createTreatmentSchema = z.object({
  healthRecordId: z.number().positive(),
  medicationName: z.string().min(1).max(255),
  dosage: z.string().min(1).max(50),
  durationDays: z.number().int().positive().optional(),
  frequency: z.enum(['ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'WEEKLY', 'MONTHLY']),
  route: z.enum(['ORAL', 'INTRAMUSCULAR', 'INTRAVENOUS', 'SUBCUTANEOUS', 'TOPICAL']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  nextDoseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});
export const updateTreatmentSchema = createTreatmentSchema.partial();

// --- Vaccinations (US-5.3) ---
export const createVaccinationSchema = z.object({
  animalId: z.number().positive(),
  vaccineType: z.string().min(1).max(255),
  batchNumber: z.string().max(50).optional(),
  date: z.string().datetime(),
  boosterDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});
export const updateVaccinationSchema = createVaccinationSchema.partial();
export const updateVaccinationStatusSchema = z.object({
  status: z.enum(['PENDING', 'DONE', 'OVERDUE']),
});

// --- Veterinary Interventions (US-5.7) ---
export const createInterventionSchema = z.object({
  animalId: z.number().positive(),
  type: z.enum(['CHECKUP', 'SURGERY', 'OBSTETRICS', 'ULTRASOUND', 'TREATMENT', 'EMERGENCY']),
  date: z.string().datetime(),
  cost: z.number().positive().optional(),
  report: z.string().optional(),
});
export const updateInterventionSchema = createInterventionSchema.partial();