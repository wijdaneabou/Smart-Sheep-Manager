import { mysqlTable, int, decimal, text, timestamp, datetime, mysqlEnum } from 'drizzle-orm/mysql-core';
import { animals } from './animals.js';
import { users } from './users.js';

export const veterinaryInterventions = mysqlTable('veterinary_interventions', {
  id: int('id').primaryKey().autoincrement(),
  animalId: int('animal_id')
    .notNull()
    .references(() => animals.id, { onDelete: 'cascade' }),
  performedBy: int('performed_by')
    .references(() => users.id, { onDelete: 'set null' }),
  date: datetime('date').notNull(),
  type: mysqlEnum('type', [
    'CHECKUP',
    'SURGERY',
    'OBSTETRICS',
    'ULTRASOUND',
    'TREATMENT',
    'EMERGENCY'
  ]).notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }),
  report: text('report'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type VeterinaryIntervention = typeof veterinaryInterventions.$inferSelect;
export type NewVeterinaryIntervention = typeof veterinaryInterventions.$inferInsert;