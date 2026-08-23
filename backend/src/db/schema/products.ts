import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  mysqlEnum,
  timestamp,
} from "drizzle-orm/mysql-core";

export const productCategories = ["AGNEAUX", "MOUTONS", "LAINE", "VIANDE", "AUTRE"] as const;

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),

  name: varchar("name", { length: 120 }).notNull(),

  category: mysqlEnum("category", productCategories).notNull(),

  description: text("description").notNull(),

  price: decimal("price", { precision: 10, scale: 2 }).notNull(),

  availability: mysqlEnum("availability", ["DISPONIBLE", "LIMITE", "RUPTURE"])
    .notNull()
    .default("DISPONIBLE"),

  photos: text("photos"),

  specifications: text("specifications"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
