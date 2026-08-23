import { z } from 'zod';

const numToStr = () => z.coerce.number().transform(String);
const numToStrOptional = () => z.coerce.number().optional().transform((v) => v === undefined ? v : String(v));
const numToStrPos = () => z.coerce.number().positive().transform(String);
const numToStrPosOpt = () => z.coerce.number().positive().optional().transform((v) => v === undefined ? v : String(v));
const numToStrNonNeg = () => z.coerce.number().nonnegative().transform(String);
const numToStrNonNegOpt = () => z.coerce.number().nonnegative().optional().transform((v) => v === undefined ? v : String(v));

// ============================================
// Feed Items Validators (US-7.1: Inventaire)
// ============================================

export const createFeedItemSchema = z.object({
  exploitationId: z.number().positive().optional(),
  name: z.string().min(1, { message: 'Le nom de l\'article est requis' }).max(255),
  category: z.enum(['FOURRAGE', 'CONCENTRE', 'MINERAL', 'VITAMINE', 'COMPLEMENT', 'AUTRE']),
  unit: z.enum(['KG', 'L', 'TONNE', 'SAC', 'UNIT']),
  unitPrice: numToStrNonNegOpt(),
  currentStock: numToStrNonNegOpt(),
  minStockThreshold: numToStrNonNegOpt(),
  supplier: z.string().max(255).optional(),
  description: z.string().optional(),
});

export const updateFeedItemSchema = z.object({
  exploitationId: z.number().positive().optional(),
  name: z.string().min(1).max(255).optional(),
  category: z.enum(['FOURRAGE', 'CONCENTRE', 'MINERAL', 'VITAMINE', 'COMPLEMENT', 'AUTRE']).optional(),
  unit: z.enum(['KG', 'L', 'TONNE', 'SAC', 'UNIT']).optional(),
  unitPrice: numToStrNonNegOpt(),
  currentStock: numToStrNonNegOpt(),
  minStockThreshold: numToStrNonNegOpt(),
  supplier: z.string().max(255).optional(),
  description: z.string().optional(),
});

// ============================================
// Feed Stocks Validators (US-7.2: Mouvements de stock)
// ============================================

export const createFeedStockSchema = z.object({
  feedItemId: z.number().positive({ message: 'L\'ID de l\'article est requis' }),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: numToStrPos(),
  unitPriceAtTime: numToStrNonNegOpt(),
  movementDate: z.string().datetime({ message: 'La date de mouvement est invalide' }),
  batchNumber: z.string().max(50).optional(),
  expiryDate: z.string().datetime().optional(),
  reference: z.string().max(255).optional(),
  notes: z.string().optional(),
});

export const updateFeedStockSchema = z.object({
  feedItemId: z.number().positive().optional(),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT']).optional(),
  quantity: numToStrPos().optional(),
  unitPriceAtTime: numToStrNonNegOpt(),
  movementDate: z.string().datetime().optional(),
  batchNumber: z.string().max(50).optional(),
  expiryDate: z.string().datetime().nullish().optional(),
  reference: z.string().max(255).optional(),
  notes: z.string().optional(),
});

// ============================================
// Feed Rations Validators (US-7.3: Formulation de rations)
// ============================================

export const createFeedRationSchema = z.object({
  exploitationId: z.number().positive().optional(),
  name: z.string().min(1, { message: 'Le nom de la ration est requis' }).max(255),
  code: z.string().max(50).optional(),
  targetType: z.enum(['AGNELAUX', 'AGNEAUX_SEVRAGE', 'BREBILLONS', 'BELIERS', 'AGNELLES', 'TOUS', 'AUTRE']),
  targetWeightKg: numToStrPosOpt(),
  dailyRationPerAnimalKg: numToStrPosOpt(),
  costPerKg: numToStrNonNegOpt(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  items: z.array(z.object({
    feedItemId: z.number().positive(),
    percentage: z.coerce.number().positive().max(100).transform(String),
    quantityKgPerTon: numToStrPosOpt(),
  })).optional(),
});

export const updateFeedRationSchema = z.object({
  exploitationId: z.number().positive().optional(),
  name: z.string().min(1).max(255).optional(),
  code: z.string().max(50).optional(),
  targetType: z.enum(['AGNELAUX', 'AGNEAUX_SEVRAGE', 'BREBILLONS', 'BELIERS', 'AGNELLES', 'TOUS', 'AUTRE']).optional(),
  targetWeightKg: numToStrPosOpt(),
  dailyRationPerAnimalKg: numToStrPosOpt(),
  costPerKg: numToStrNonNegOpt(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  items: z.array(z.object({
    feedItemId: z.number().positive(),
    percentage: z.coerce.number().positive().max(100).transform(String),
    quantityKgPerTon: numToStrPosOpt(),
  })).optional(),
});

// ============================================
// Feed Ration Item Validators
// ============================================

export const createFeedRationItemSchema = z.object({
  rationId: z.number().positive({ message: 'L\'ID de la ration est requis' }),
  feedItemId: z.number().positive({ message: 'L\'ID de l\'article est requis' }),
  percentage: z.coerce.number().positive().max(100, { message: 'Le pourcentage ne peut pas dépasser 100%' }).transform(String),
  quantityKgPerTon: numToStrPosOpt(),
});

export const updateFeedRationItemSchema = z.object({
  rationId: z.number().positive().optional(),
  feedItemId: z.number().positive().optional(),
  percentage: z.coerce.number().positive().max(100).transform(String).optional(),
  quantityKgPerTon: numToStrPosOpt(),
});

// ============================================
// Feed Distributions Validators (US-7.4: Distribution)
// ============================================

export const createFeedDistributionSchema = z.object({
  rationId: z.number().positive().optional(),
  targetType: z.enum(['ANIMAL', 'BATCH', 'BATIMENT', 'LOT']),
  animalId: z.number().positive().optional(),
  batimentId: z.number().positive().optional(),
  batchName: z.string().max(150).optional(),
  distributionDate: z.string().datetime({ message: 'La date de distribution est invalide' }),
  timeOfDay: z.enum(['MORNING', 'MIDDAY', 'EVENING', 'NIGHT', 'ALL_DAY']).optional(),
  quantityDistributedKg: numToStrPos(),
  numberOfAnimals: z.number().int().positive().optional(),
  refusedQuantityKg: numToStrNonNegOpt(),
  weatherConditions: z.enum(['BON', 'CHAUD', 'FROID', 'HUMIDE', 'SEC']).optional(),
  notes: z.string().optional(),
});

export const updateFeedDistributionSchema = z.object({
  rationId: z.number().positive().optional(),
  targetType: z.enum(['ANIMAL', 'BATCH', 'BATIMENT', 'LOT']).optional(),
  animalId: z.number().positive().optional(),
  batimentId: z.number().positive().optional(),
  batchName: z.string().max(150).optional(),
  distributionDate: z.string().datetime().optional(),
  timeOfDay: z.enum(['MORNING', 'MIDDAY', 'EVENING', 'NIGHT', 'ALL_DAY']).optional(),
  quantityDistributedKg: numToStrPos().optional(),
  numberOfAnimals: z.number().int().positive().optional(),
  refusedQuantityKg: numToStrNonNegOpt(),
  weatherConditions: z.enum(['BON', 'CHAUD', 'FROID', 'HUMIDE', 'SEC']).optional(),
  notes: z.string().optional(),
});
