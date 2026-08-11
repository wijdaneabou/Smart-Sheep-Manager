import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { exploitations } from "./exploitations.js";

export const iotZones = mysqlTable("iot_zones", {
  id: int("id").autoincrement().primaryKey(),

  exploitationId: int("exploitation_id")
    .notNull()
    .references((): AnyMySqlColumn => exploitations.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#0F7A3C"),

  // Polygone stocké en JSON : [{ "lat": 33.57, "lng": -7.58 }, ...]
  // (au moins 3 points pour former un polygone valide)
  polygon: text("polygon").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type IotZone = typeof iotZones.$inferSelect;
export type NewIotZone = typeof iotZones.$inferInsert;

export type ZonePoint = { lat: number; lng: number };