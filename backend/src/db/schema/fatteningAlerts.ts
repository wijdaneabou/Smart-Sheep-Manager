import {
  mysqlTable,
  int,
  text,
  mysqlEnum,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { fatteningBatches } from "./fatteningBatches.js";
import { exploitations } from "./exploitations.js";
import { relations } from "drizzle-orm";

export const fatteningAlerts = mysqlTable("fattening_alerts", {
  id: int("id").autoincrement().primaryKey(),

  fatteningBatchId: int("fattening_batch_id")
    .notNull()
    .references(() => fatteningBatches.id, { onDelete: "cascade" }),

  exploitationId: int("exploitation_id").references(
    (): any => exploitations.id,
    { onDelete: "cascade" }
  ),

  type: mysqlEnum("type", ["LOW_GMQ", "WEIGHT_DEVIATION"]).notNull(),

  severity: mysqlEnum("severity", ["WARNING", "CRITICAL"])
    .notNull()
    .default("WARNING"),

  message: text("message").notNull(),

  value: varchar("value", { length: 100 }),
  threshold: varchar("threshold", { length: 100 }),

  resolved: int("resolved").notNull().default(0),
  resolvedAt: timestamp("resolved_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fatteningAlertsRelations = relations(
  fatteningAlerts,
  ({ one }) => ({
    batch: one(fatteningBatches, {
      fields: [fatteningAlerts.fatteningBatchId],
      references: [fatteningBatches.id],
    }),
    exploitation: one(exploitations, {
      fields: [fatteningAlerts.exploitationId],
      references: [exploitations.id],
    }),
  })
);
