// backend/src/db/schema/budgets.ts

import { mysqlTable, int, decimal, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { exploitations } from './exploitations.js';
import { users } from './users.js';

export const budgetCategories = [
  'ALIMENTATION',
  'SANTE',
  'MAIN_DOEUVRE',
  'EQUIPMENT',
  'REPRODUCTION',
  'IOT',
  'DIVERS',
] as const;

export type BudgetCategory = typeof budgetCategories[number];

export const budgets = mysqlTable('budgets', {
  id: int('id').primaryKey().autoincrement(),
  exploitationId: int('exploitation_id')
    .notNull()
    .references(() => exploitations.id, { onDelete: 'cascade' }),
  year: int('year').notNull(),
  month: int('month'), // 1-12, nullable => annual total if null
  category: mysqlEnum('category', budgetCategories).notNull(),
  plannedAmount: decimal('planned_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  actualAmount: decimal('actual_amount', { precision: 12, scale: 2 }).default('0.00'),
  notes: text('notes'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: int('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;