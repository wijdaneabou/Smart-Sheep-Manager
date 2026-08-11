import {
  mysqlTable,
  int,
  varchar,
  text,
  mysqlEnum,
  timestamp,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { iotShields } from "./iotShields.js";
import { animals } from "./animals.js";
import { exploitations } from "./exploitations.js";
import { relations } from "drizzle-orm";

export const iotAlerts = mysqlTable("iot_alerts", {
  id: int("id").autoincrement().primaryKey(),
  shieldId: int("shield_id")
    .notNull()
    .references((): AnyMySqlColumn => iotShields.id, { onDelete: "cascade" }),
  animalId: int("animal_id").references((): AnyMySqlColumn => animals.id, {
    onDelete: "set null",
  }),
  exploitationId: int("exploitation_id").references(
    (): AnyMySqlColumn => exploitations.id,
    { onDelete: "cascade" }
  ),
  type: mysqlEnum("type", [
    "HIGH_TEMPERATURE",
    "INACTIVITY",
    "LOW_BATTERY",
    "OUT_OF_ZONE",
  ]).notNull(),
  severity: mysqlEnum("severity", ["WARNING", "CRITICAL"]).notNull().default("WARNING"),
  message: text("message").notNull(),
  value: varchar("value", { length: 100 }),
  threshold: varchar("threshold", { length: 100 }),
  resolved: int("resolved").notNull().default(0),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const iotAlertsRelations = relations(iotAlerts, ({ one }) => ({
  shield: one(iotShields, {
    fields: [iotAlerts.shieldId],
    references: [iotShields.id],
  }),
  animal: one(animals, {
    fields: [iotAlerts.animalId],
    references: [animals.id],
  }),
  exploitation: one(exploitations, {
    fields: [iotAlerts.exploitationId],
    references: [exploitations.id],
  }),
}));