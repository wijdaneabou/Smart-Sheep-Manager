import { mysqlTable, int, text, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { animals } from './animals.js';
import { users } from './users.js';

export const healthRecords = mysqlTable('health_records', {
  id: int('id').primaryKey().autoincrement(),
  animalId: int('animal_id').notNull().references(() => animals.id, { onDelete: 'cascade' }),
  status: mysqlEnum('status', ['HEALTHY', 'SURVEILLANCE', 'SICK', 'UNDER_TREATMENT', 'RECOVERED'])
    .default('HEALTHY').notNull(),
  symptoms: text('symptoms'),
  diagnosis: text('diagnosis'),
  severity: mysqlEnum('severity', ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  recordedBy: int('recorded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type HealthRecord = typeof healthRecords.$inferSelect;
export type NewHealthRecord = typeof healthRecords.$inferInsert;