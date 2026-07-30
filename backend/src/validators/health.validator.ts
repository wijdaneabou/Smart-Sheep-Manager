import { z } from 'zod';


export const createHealthRecordSchema = z.object({
  animalId: z.number().positive({ message: "L'ID de l'animal est requis" }),
  status: z.enum(['HEALTHY', 'SURVEILLANCE', 'SICK', 'UNDER_TREATMENT', 'RECOVERED']),
  symptoms: z.string().optional(),
  diagnosis: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
});


export const updateHealthRecordSchema = createHealthRecordSchema.partial();

// Validators pour les traitements (US-5.2)

export const createTreatmentSchema = z.object({
  healthRecordId: z.number().positive({ message: "L'ID du dossier médical est requis" }),
  medicationName: z.string().min(1, { message: "Le nom du médicament est requis" }).max(255),
  dosage: z.string().min(1, { message: "Le dosage est requis" }).max(50),
  durationDays: z.number().int().positive().optional(),
  frequency: z.enum(['ONCE_DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'WEEKLY', 'MONTHLY']),
  route: z.enum(['ORAL', 'INTRAMUSCULAR', 'INTRAVENOUS', 'SUBCUTANEOUS', 'TOPICAL']),
  startDate: z.string().datetime({ message: "La date de début est invalide" }),
  endDate: z.string().datetime().optional(),
  nextDoseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateTreatmentSchema = createTreatmentSchema.partial();

export const administerTreatmentSchema = z.object({
  administeredBy: z.number().positive(),
});
export const createVaccinationSchema = z.object({
  animalId: z.number().positive({ message: "L'ID de l'animal est requis" }),
  vaccineType: z.string().min(1, { message: "Le type de vaccin est requis" }).max(255),
  batchNumber: z.string().max(50).optional(),
  date: z.string().datetime({ message: "La date doit être au format ISO" }),
  boosterDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateVaccinationSchema = createVaccinationSchema.partial();

export const updateVaccinationStatusSchema = z.object({
  status: z.enum(['PENDING', 'DONE', 'OVERDUE']),
});
export const createInterventionSchema = z.object({
  animalId: z.number().positive({ message: "L'ID de l'animal est requis" }),
  performedBy: z.number().positive().optional(),
  date: z.string().datetime({ message: "La date doit être au format ISO" }),
  type: z.enum(['CHECKUP', 'SURGERY', 'OBSTETRICS', 'ULTRASOUND', 'TREATMENT', 'EMERGENCY']),
  cost: z.number().positive().optional(),
  report: z.string().optional(),
});

export const updateInterventionSchema = createInterventionSchema.partial();