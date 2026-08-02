import { mysqlTable, int, varchar, date, boolean, text, timestamp, index } from 'drizzle-orm/mysql-core';
import { animals } from './animals.js';
import { users } from './users.js';

export const reproductionCycles = mysqlTable(
  'reproduction_cycles',
  {
    id: int('id').primaryKey().autoincrement(),
    animalId: int('animal_id')
      .notNull()
      .references(() => animals.id, { onDelete: 'cascade' }),
    heatDate: date('heat_date').notNull(),
    matingType: varchar('mating_type', { length: 20 })
      .notNull()
      .$type<'natural' | 'ai'>(),
    maleId: int('male_id')
      .references(() => animals.id, { onDelete: 'set null' }),
    semenReference: varchar('semen_reference', { length: 100 }),
    pregnancyConfirmed: boolean('pregnancy_confirmed').default(false),
    confirmationDate: date('confirmation_date'),
    notes: text('notes'),
    createdBy: int('created_by')
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    animalIdx: index('repro_cycle_animal_idx').on(table.animalId),
    heatDateIdx: index('repro_cycle_heat_date_idx').on(table.heatDate),
  })
);