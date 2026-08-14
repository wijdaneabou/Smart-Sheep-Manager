import {
  mysqlTable,
  int,
  varchar,
  decimal,
  mysqlEnum,
  date,
  timestamp,
} from "drizzle-orm/mysql-core";
import { exploitations } from "./exploitations.js";
import { relations } from "drizzle-orm";

export const fatteningBatches = mysqlTable("fattening_batches", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 120 }).notNull(),

  startDate: date("start_date").notNull(),

  animalCount: int("animal_count").notNull(),

  initialAverageWeight: decimal("initial_average_weight", {
    precision: 6,
    scale: 2,
  }).notNull(),

  targetWeight: decimal("target_weight", { precision: 6, scale: 2 }).notNull(),

  targetDailyGmq: decimal("target_daily_gmq", { precision: 5, scale: 3 }),

  estimatedEndDate: date("estimated_end_date"),

  status: mysqlEnum("status", ["ACTIVE", "COMPLETED", "CANCELLED"])
    .notNull()
    .default("ACTIVE"),

  exploitationId: int("exploitation_id").references(
    (): any => exploitations.id
  ),

  notes: varchar("notes", { length: 255 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fatteningBatchesRelations = relations(
  fatteningBatches,
  ({ one }) => ({
    exploitation: one(exploitations, {
      fields: [fatteningBatches.exploitationId],
      references: [exploitations.id],
    }),
  })
);
