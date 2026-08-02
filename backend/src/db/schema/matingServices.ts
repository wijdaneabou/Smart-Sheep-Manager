import { mysqlTable, int, varchar, date, text, timestamp, index } from 'drizzle-orm/mysql-core';
import { animals } from './animals.js';
import { users } from './users.js';
import { reproductionCycles } from './reproductionCycles.js';

export const matingServices = mysqlTable(
  'mating_services',
  {
    id: int('id').primaryKey().autoincrement(),
    animalId: int('animal_id')
      .notNull()
      .references(() => animals.id, { onDelete: 'cascade' }),
    cycleId: int('cycle_id')
      .references(() => reproductionCycles.id, { onDelete: 'set null' }),
    serviceDate: date('service_date').notNull(),
    type: varchar('type', { length: 20 })
      .notNull()
      .$type<'natural' | 'ai'>(),
    maleId: int('male_id')
      .references(() => animals.id, { onDelete: 'set null' }),
    semenReference: varchar('semen_reference', { length: 100 }),
    serviceNumber: int('service_number').notNull().default(1),
    result: varchar('result', { length: 20 })
      .$type<'success' | 'failure' | 'pending'>()
      .default('pending'),
    notes: text('notes'),
    createdBy: int('created_by')
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    animalIdx: index('mating_animal_idx').on(table.animalId),
    cycleIdx: index('mating_cycle_idx').on(table.cycleId),
    dateIdx: index('mating_date_idx').on(table.serviceDate),
  })
);