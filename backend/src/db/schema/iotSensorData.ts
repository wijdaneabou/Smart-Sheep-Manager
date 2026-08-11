import {
  mysqlTable,
  int,
  decimal,
  mysqlEnum,
  timestamp,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { iotShields } from "./iotShields.js";
import { relations } from "drizzle-orm";

export const iotSensorData = mysqlTable("iot_sensor_data", {
  id: int("id").autoincrement().primaryKey(),

  // Bouclier IoT source
  shieldId: int("shield_id")
    .notNull()
    .references((): AnyMySqlColumn => iotShields.id, { onDelete: "cascade" }),

  // Température corporelle (°C) — plage 36-41
  temperature: decimal("temperature", { precision: 4, scale: 2 }),

  // Activité du mouton
  activity: mysqlEnum("activity", ["REST", "MOVEMENT", "GRAZING"]),

  // Position GPS
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),

  // Timestamp de la mesure (provenant du capteur)
  measuredAt: timestamp("measured_at").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

export const iotSensorDataRelations = relations(
  iotSensorData,
  ({ one }) => ({
    shield: one(iotShields, {
      fields: [iotSensorData.shieldId],
      references: [iotShields.id],
    }),
  })
);
