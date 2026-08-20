import { z } from 'zod';

const numToStr = () => z.coerce.number().transform(String);
const numToStrOptional = () => z.coerce.number().optional().transform((v) => v === undefined ? v : String(v));
const numToStrPos = () => z.coerce.number().positive().transform(String);
const numToStrPosOpt = () => z.coerce.number().positive().optional().transform((v) => v === undefined ? v : String(v));
const numToStrNonNeg = () => z.coerce.number().nonnegative().transform(String);
const numToStrNonNegOpt = () => z.coerce.number().nonnegative().optional().transform((v) => v === undefined ? v : String(v));

// ============================================
// US-7.3 SP-1: Enregistrement d'un approvisionnement (achat)
// ============================================
export const createPurchaseSchema = z.object({
  feedItemId: z.number().positive({ message: 'L\'article est requis' }),
  quantity: numToStrPos(),
  unitPurchasePrice: numToStrNonNeg(),
  totalCost: numToStrNonNegOpt(),
  purchaseDate: z.string().datetime({ message: 'Date d\'achat invalide' }),
  supplier: z.string().max(255).optional(),
  batchNumber: z.string().max(50).optional(),
  expiryDate: z.string().datetime().optional(),
  invoiceReference: z.string().max(255).optional(),
  notes: z.string().optional(),
});

export const updatePurchaseSchema = z.object({
  feedItemId: z.number().positive().optional(),
  quantity: numToStrPosOpt(),
  unitPurchasePrice: numToStrNonNegOpt(),
  totalCost: numToStrNonNegOpt(),
  purchaseDate: z.string().datetime().optional(),
  supplier: z.string().max(255).optional(),
  batchNumber: z.string().max(50).optional(),
  expiryDate: z.string().datetime().nullish().optional(),
  invoiceReference: z.string().max(255).optional(),
  notes: z.string().optional(),
});

// ============================================
// US-7.3 SP-2: Filtres pour stock par type / catégorie
// ============================================
export const stockByTypeFilterSchema = z.object({
  exploitationId: z.coerce.number().positive().optional(),
  category: z.enum(['FOURRAGE', 'CONCENTRE', 'MINERAL', 'VITAMINE', 'COMPLEMENT', 'AUTRE']).optional(),
  unit: z.enum(['KG', 'L', 'TONNE', 'SAC', 'UNIT']).optional(),
  includeEmpty: z.coerce.boolean().optional().default(false),
});

// ============================================
// US-7.3 SP-3: Historique achats - filtres période
// ============================================
export const purchaseHistoryFilterSchema = z.object({
  feedItemId: z.coerce.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  supplier: z.string().optional(),
  minTotalCost: numToStrNonNegOpt(),
  maxTotalCost: numToStrNonNegOpt(),
});

// ============================================
// US-7.3 SP-4: Alertes péremption - paramètres fenêtre
// ============================================
export const expiryAlertSchema = z.object({
  daysWindow: z.coerce.number().int().min(1).max(365).default(30),
  exploitationId: z.coerce.number().positive().optional(),
  onlyWithStock: z.coerce.boolean().optional().default(true),
});

// ============================================
// US-7.3 SP-5: Définition / Mise à jour seuils minimaux
// ============================================
export const updateThresholdSchema = z.object({
  feedItemId: z.number().positive({ message: 'L\'article est requis' }),
  minStockThreshold: numToStrNonNeg(),
  safetyStockDays: z.coerce.number().int().nonnegative().optional(),
  reorderPoint: numToStrNonNegOpt(),
});

// ============================================
// US-7.3 SP-6: Alertes stock critique - filtres
// ============================================
export const criticalStockAlertSchema = z.object({
  exploitationId: z.coerce.number().positive().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  belowPercentage: z.coerce.number().min(0).max(100).optional(),
});

// ============================================
// US-7.3 SP-7: Analyse coûts approvisionnement
// ============================================
export const purchaseCostAnalysisSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  groupBy: z.enum(['FEEDITEM', 'CATEGORY', 'SUPPLIER', 'MONTH', 'WEEK']).default('MONTH'),
  feedItemId: z.coerce.number().positive().optional(),
  category: z.enum(['FOURRAGE', 'CONCENTRE', 'MINERAL', 'VITAMINE', 'COMPLEMENT', 'AUTRE']).optional(),
});

// ============================================
// US-7.3 SP-8: Prédiction de rupture - paramètres
// ============================================
export const stockoutPredictionSchema = z.object({
  exploitationId: z.coerce.number().positive().optional(),
  consumptionWindowDays: z.coerce.number().int().min(7).max(365).default(30),
  horizonDays: z.coerce.number().int().min(1).max(180).default(90),
  includePurchaseLeadTime: z.coerce.number().int().nonnegative().optional().default(7),
});

// ============================================
// US-7.4: FCR / Efficacité alimentaire - paramètres
// ============================================
export const fcrAnalysisSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)'),
  groupBy: z.enum(['ANIMAL', 'BATCH', 'BATIMENT', 'GLOBAL']).default('ANIMAL'),
  targetType: z.enum(['ANIMAL', 'BATCH', 'BATIMENT', 'LOT']).optional(),
  batimentId: z.coerce.number().positive().optional(),
  animalId: z.coerce.number().positive().optional(),
});

export const foodCostPerAnimalSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)'),
  groupBy: z.enum(['ANIMAL', 'BATCH', 'BATIMENT', 'MONTH']).default('ANIMAL'),
});
