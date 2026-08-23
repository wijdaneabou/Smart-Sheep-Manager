import { mysqlTable, int, varchar, text, decimal, mysqlEnum, timestamp, date } from 'drizzle-orm/mysql-core';
import { feedItems } from './feedItems.js';
import { users } from './users.js';

export const feedStocks = mysqlTable('feed_stocks', {
  id: int('id').primaryKey().autoincrement(),
  feedItemId: int('feed_item_id')
    .notNull()
    .references(() => feedItems.id, { onDelete: 'cascade' }),
  movementType: mysqlEnum('movement_type', ['IN', 'OUT', 'ADJUSTMENT']).notNull(),
  quantity: decimal('quantity', { precision: 12, scale: 3 }).notNull(),
  unitPriceAtTime: decimal('unit_price_at_time', { precision: 10, scale: 2 }),
  movementDate: date('movement_date').notNull(),
  batchNumber: varchar('batch_number', { length: 50 }),
  expiryDate: date('expiry_date'),
  reference: varchar('reference', { length: 255 }),
  notes: text('notes'),
  recordedBy: int('recorded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type FeedStock = typeof feedStocks.$inferSelect;
export type NewFeedStock = typeof feedStocks.$inferInsert;
