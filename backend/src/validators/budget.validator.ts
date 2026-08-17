import { z } from 'zod';

export const BUDGET_CATEGORIES = [
  'ALIMENTATION',
  'SANTE',
  'MAIN_DOEUVRE',
  'EQUIPMENT',
  'REPRODUCTION',
  'IOT',
  'DIVERS',
] as const;

export type BudgetCategory = typeof BUDGET_CATEGORIES[number];

const budgetBaseSchema = {
  exploitationId: z.number().positive(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12).optional().nullable(),
  category: z.enum(BUDGET_CATEGORIES),
  plannedAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
};

export const createBudgetSchema = z.object({
  ...budgetBaseSchema,
});

export const updateBudgetSchema = z.object({
  exploitationId: z.number().positive().optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional().nullable(),
  category: z.enum(BUDGET_CATEGORIES).optional(),
  plannedAmount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});