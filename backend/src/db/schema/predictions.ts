// src/db/schema/predictions.ts
import { mysqlTable, int, decimal, varchar, json, datetime, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { animals } from './animals.js';

export const predictions = mysqlTable(
  'predictions',
  {
    id: int('id').autoincrement().primaryKey(),
    animalId: int('animal_id')  // ← The column name in the database is 'animal_id'
      .notNull()
      .references(() => animals.id, { onDelete: 'cascade' }),
    prediction: int('prediction').notNull(),
    probability: decimal('probability', { precision: 5, scale: 4 }).notNull(),
    riskLevel: varchar('risk_level', { length: 20 }).notNull(),
    thresholdUsed: decimal('threshold_used', { precision: 4, scale: 2 }).notNull(),
    profileUsed: varchar('profile_used', { length: 20 }).notNull(),
    explanations: json('explanations'),
    featureValues: json('feature_values'),
    createdAt: datetime('created_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    animalIdx: index('idx_animal_id').on(table.animalId),
    riskIdx: index('idx_risk_level').on(table.riskLevel),
    createdAtIdx: index('idx_created_at').on(table.createdAt),
  })
);

export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;