import { mysqlTable, int, varchar, text, decimal, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import { exploitations } from './exploitations.js';
import { users } from './users.js';

export const feedRations = mysqlTable('feed_rations', {
  id: int('id').primaryKey().autoincrement(),
  exploitationId: int('exploitation_id')
    .references(() => exploitations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  targetType: mysqlEnum('target_type', [
    'AGNELAUX',
    'AGNEAUX_SEVRAGE',
    'BREBILLONS',
    'BELIERS',
    'AGNELLES',
    'TOUS',
    'AUTRE',
  ]).notNull().default('TOUS'),
  targetWeightKg: decimal('target_weight_kg', { precision: 6, scale: 2 }),
  dailyRationPerAnimalKg: decimal('daily_ration_per_animal_kg', { precision: 6, scale: 3 }),
  costPerKg: decimal('cost_per_kg', { precision: 10, scale: 2 }).default('0.00'),
  description: text('description'),
  status: mysqlEnum('status', ['ACTIVE', 'INACTIVE', 'ARCHIVED']).notNull().default('ACTIVE'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type FeedRation = typeof feedRations.$inferSelect;
export type NewFeedRation = typeof feedRations.$inferInsert;
