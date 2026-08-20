import { mysqlTable, int, decimal, timestamp } from 'drizzle-orm/mysql-core';
import { feedRations } from './feedRations.js';
import { feedItems } from './feedItems.js';

export const feedRationItems = mysqlTable('feed_ration_items', {
  id: int('id').primaryKey().autoincrement(),
  rationId: int('ration_id')
    .notNull()
    .references(() => feedRations.id, { onDelete: 'cascade' }),
  feedItemId: int('feed_item_id')
    .notNull()
    .references(() => feedItems.id, { onDelete: 'cascade' }),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  quantityKgPerTon: decimal('quantity_kg_per_ton', { precision: 8, scale: 3 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type FeedRationItem = typeof feedRationItems.$inferSelect;
export type NewFeedRationItem = typeof feedRationItems.$inferInsert;
