import { mysqlTable, int, varchar, text, decimal, timestamp, boolean } from "drizzle-orm/mysql-core";

export const clientSegments = mysqlTable("client_segments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 60 }).notNull().unique(),
  description: text("description"),
  minScore: int("min_score").default(0),
  maxScore: int("max_score").default(100),
  minFrequency: int("min_frequency").default(0),
  maxFrequency: int("max_frequency"),
  minBasket: decimal("min_basket", { precision: 12, scale: 2 }).default("0"),
  maxBasket: decimal("max_basket", { precision: 12, scale: 2 }),
  color: varchar("color", { length: 20 }).default("#15803D"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
