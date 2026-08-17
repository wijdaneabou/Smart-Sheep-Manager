// backend/src/db/schema/expenses.ts

import { mysqlTable, int, decimal, varchar, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { exploitations } from './exploitations.js';
import { users } from './users.js';

export const expenseCategories = [
  'ALIMENTATION',
  'SANTE',
  'REPRODUCTION',
  'MAIN_DOEUVRE',
  'EQUIPMENT',
  'IOT',
  'DIVERS',
] as const;

export type ExpenseCategory = typeof expenseCategories[number];

export const expenses = mysqlTable('expenses', {
  id: int('id').primaryKey().autoincrement(),
  exploitationId: int('exploitation_id')
    .notNull()
    .references(() => exploitations.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull().defaultNow(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  category: mysqlEnum('category', expenseCategories).notNull(),
  beneficiary: varchar('beneficiary', { length: 255 }),
  paymentMethod: mysqlEnum('payment_method', ['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'OTHER']).default('CASH'),
  justification: text('justification'), // URL or file path
  notes: text('notes'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: int('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;