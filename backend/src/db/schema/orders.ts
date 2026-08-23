import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  mysqlEnum,
  timestamp,
} from "drizzle-orm/mysql-core";

export const orderStatuses = [
  "BROUILLON",
  "ENVOYE",
  "VALIDE",
  "EN_PREPARATION",
  "EXPEDIE",
  "LIVRE",
  "FACTURE",
  "PAYE",
] as const;

export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),

  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),

  status: mysqlEnum("status", orderStatuses).notNull().default("BROUILLON"),

  clientId: int("client_id").notNull(),

  clientName: varchar("client_name", { length: 120 }).notNull(),

  clientContact: varchar("client_contact", { length: 255 }).notNull(),

  notes: text("notes"),

  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),

  tax: decimal("tax", { precision: 12, scale: 2 }).default("0"),

  total: decimal("total", { precision: 12, scale: 2 }).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),

  orderId: int("order_id").notNull(),

  productId: int("product_id").notNull(),

  productName: varchar("product_name", { length: 120 }).notNull(),

  quantity: int("quantity").notNull(),

  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),

  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
