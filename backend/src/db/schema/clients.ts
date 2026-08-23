import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 120 }).notNull(),

  contact: varchar("contact", { length: 255 }).notNull(),

  type: mysqlEnum("type", [
    "ACHETEUR",
    "BOUCHER",
    "GROSSISTE",
    "COOPERATIVE",
  ]).notNull(),

  purchaseHistory: text("purchase_history"),

  preferences: text("preferences"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
