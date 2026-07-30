import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, date, boolean } from 'drizzle-orm/mysql-core';
import { healthRecords } from './healthRecords.js';
import { users } from './users.js';

export const treatments = mysqlTable('treatments', {
  id: int('id').primaryKey().autoincrement(),
  healthRecordId: int('health_record_id')
    .notNull()
    .references(() => healthRecords.id, { onDelete: 'cascade' }),
  medicationName: varchar('medication_name', { length: 255 }).notNull(),
  dosage: varchar('dosage', { length: 50 }).notNull(),
  durationDays: int('duration_days'),
  frequency: mysqlEnum('frequency', [
    'ONCE_DAILY',
    'TWICE_DAILY',
    'THREE_TIMES_DAILY',
    'WEEKLY',
    'MONTHLY'
  ]).notNull(),
  route: mysqlEnum('route', [
    'ORAL',
    'INTRAMUSCULAR',
    'INTRAVENOUS',
    'SUBCUTANEOUS',
    'TOPICAL'
  ]).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  nextDoseDate: date('next_dose_date'),
  administered: boolean('administered').default(false),
  administeredAt: timestamp('administered_at'),
  administeredBy: int('administered_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type Treatment = typeof treatments.$inferSelect;
export type NewTreatment = typeof treatments.$inferInsert;