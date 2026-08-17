// backend/src/validators/expense.validator.ts

import { z } from 'zod';
import { expenseCategories } from '../db/schema/expenses.js';

export const paymentMethods = ['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'OTHER'] as const;

export const createExpenseSchema = z.object({
  exploitationId: z.number().positive(),
  date: z.string().datetime().optional(), // ISO string
  amount: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
  category: z.enum(expenseCategories),
  beneficiary: z.string().max(255).optional().nullable(),
  paymentMethod: z.enum(paymentMethods).default('CASH'),
  justification: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();