// backend/src/db/schema/revenues.ts

import { mysqlTable, int, decimal, varchar, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { exploitations } from './exploitations.js';
import { users } from './users.js';

export const revenueTypes = [
  'LAMB_SALE',
  'WOOL_SALE',
  'BY_PRODUCT',
  'OTHER',
] as const;

export type RevenueType = typeof revenueTypes[number];

export const revenueStatuses = [
  'COLLECTED',
  'PENDING',
] as const;

export type RevenueStatus = typeof revenueStatuses[number];

export const revenues = mysqlTable('revenues', {
  id: int('id').primaryKey().autoincrement(),
  exploitationId: int('exploitation_id')
    .notNull()
    .references(() => exploitations.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull().defaultNow(),
  type: mysqlEnum('type', revenueTypes).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 2 }),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }),
  totalHT: decimal('total_ht', { precision: 12, scale: 2 }).notNull(),
  totalTTC: decimal('total_ttc', { precision: 12, scale: 2 }).notNull(),
  buyer: varchar('buyer', { length: 255 }),
  paymentMethod: mysqlEnum('payment_method', ['CASH', 'BANK_TRANSFER', 'CHECK', 'CARD', 'OTHER']).default('CASH'),
  status: mysqlEnum('status', revenueStatuses).default('PENDING'),
  notes: text('notes'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  updatedBy: int('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type Revenue = typeof revenues.$inferSelect;
export type NewRevenue = typeof revenues.$inferInsert;