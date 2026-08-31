import { mysqlTable, int, varchar, text, decimal, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import { exploitations } from './exploitations.js';
import { users } from './users.js';

export const feedItems = mysqlTable('feed_items', {
  id: int('id').primaryKey().autoincrement(),
  exploitationId: int('exploitation_id')
    .references(() => exploitations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  category: mysqlEnum('category', [
    'FOURRAGE',
    'CONCENTRE',
    'MINERAL',
    'VITAMINE',
    'COMPLEMENT',
    'AUTRE',
  ]).notNull().default('AUTRE'),
  unit: mysqlEnum('unit', ['KG', 'L', 'TONNE', 'SAC', 'UNIT']).notNull().default('KG'),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).default('0.00'),
  currentStock: decimal('current_stock', { precision: 12, scale: 3 }).default('0.000'),
  minStockThreshold: decimal('min_stock_threshold', { precision: 12, scale: 3 }).default('0.000'),
  supplier: varchar('supplier', { length: 255 }),
  description: text('description'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type FeedItem = typeof feedItems.$inferSelect;
export type NewFeedItem = typeof feedItems.$inferInsert;
