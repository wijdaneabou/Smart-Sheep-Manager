import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const deliveryStatuses = [
  "EN_ATTENTE",
  "EN_COURS",
  "LIVRE",
] as const;

export const deliveries = mysqlTable("deliveries", {
  id: int("id").autoincrement().primaryKey(),

  deliveryNumber: varchar("delivery_number", { length: 50 }).notNull().unique(),

  status: mysqlEnum("status", deliveryStatuses).notNull().default("EN_ATTENTE"),

  deliveryDate: varchar("delivery_date", { length: 20 }).notNull(),

  address: varchar("address", { length: 255 }).notNull(),

  carrier: varchar("carrier", { length: 120 }).notNull(),

  trackingNumber: varchar("tracking_number", { length: 120 }).notNull(),

  deliveryNote: text("delivery_note"),

  clientId: int("client_id"),

  clientName: varchar("client_name", { length: 120 }).notNull(),

  clientContact: varchar("client_contact", { length: 255 }).notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
