import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, date } from 'drizzle-orm/mysql-core';
import { animals } from './animals.js';
import { users } from './users.js';

export const vaccinations = mysqlTable('vaccinations', {
  id: int('id').primaryKey().autoincrement(),
  animalId: int('animal_id')
    .notNull()
    .references(() => animals.id, { onDelete: 'cascade' }),
  vaccineType: varchar('vaccine_type', { length: 255 }).notNull(),
  batchNumber: varchar('batch_number', { length: 50 }),
  date: date('date').notNull(),
  boosterDate: date('booster_date'),
  status: mysqlEnum('status', ['PENDING', 'DONE', 'OVERDUE']).default('PENDING').notNull(),
  administeredBy: int('administered_by').references(() => users.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export type Vaccination = typeof vaccinations.$inferSelect;
export type NewVaccination = typeof vaccinations.$inferInsert;