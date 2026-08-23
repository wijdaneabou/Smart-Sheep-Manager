import { mysqlTable, int, text, decimal, mysqlEnum, timestamp, date, varchar } from 'drizzle-orm/mysql-core';
import { feedRations } from './feedRations.js';
import { batiments } from './batiments.js';
import { animals } from './animals.js';
import { users } from './users.js';

export const feedDistributions = mysqlTable('feed_distributions', {
  id: int('id').primaryKey().autoincrement(),
  rationId: int('ration_id')
    .references(() => feedRations.id, { onDelete: 'set null' }),
  targetType: mysqlEnum('target_type', ['ANIMAL', 'BATCH', 'BATIMENT', 'LOT']).notNull(),
  animalId: int('animal_id')
    .references(() => animals.id, { onDelete: 'set null' }),
  batimentId: int('batiment_id')
    .references(() => batiments.id, { onDelete: 'set null' }),
  batchName: varchar('batch_name', { length: 150 }),
  distributionDate: date('distribution_date').notNull(),
  timeOfDay: mysqlEnum('time_of_day', ['MORNING', 'MIDDAY', 'EVENING', 'NIGHT', 'ALL_DAY']).notNull().default('ALL_DAY'),
  quantityDistributedKg: decimal('quantity_distributed_kg', { precision: 10, scale: 3 }).notNull(),
  numberOfAnimals: int('number_of_animals'),
  refusedQuantityKg: decimal('refused_quantity_kg', { precision: 10, scale: 3 }).default('0.000'),
  weatherConditions: mysqlEnum('weather_conditions', ['BON', 'CHAUD', 'FROID', 'HUMIDE', 'SEC']).default('BON'),
  notes: text('notes'),
  distributedBy: int('distributed_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type FeedDistribution = typeof feedDistributions.$inferSelect;
export type NewFeedDistribution = typeof feedDistributions.$inferInsert;
