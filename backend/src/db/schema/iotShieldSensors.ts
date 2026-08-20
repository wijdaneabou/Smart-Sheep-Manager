import {
  mysqlTable,
  int,
  mysqlEnum,
  timestamp,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { iotShields } from "./iotShields.js";
import { relations } from "drizzle-orm";

export const iotShieldSensors = mysqlTable("iot_shield_sensors", {
  id: int("id").autoincrement().primaryKey(),

  shieldId: int("shield_id")
    .notNull()
    .references((): AnyMySqlColumn => iotShields.id, { onDelete: "cascade" }),

  sensorType: mysqlEnum("sensor_type", [
    "TEMPERATURE",
    "ACTIVITY",
    "GPS",
  ]).notNull(),

  status: mysqlEnum("status", ["ACTIVE", "INACTIVE"])
    .notNull()
    .default("ACTIVE"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const iotShieldSensorsRelations = relations(iotShieldSensors, ({ one }) => ({
  shield: one(iotShields, {
    fields: [iotShieldSensors.shieldId],
    references: [iotShields.id],
  }),
}));
