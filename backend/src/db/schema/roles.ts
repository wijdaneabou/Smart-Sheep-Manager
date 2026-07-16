import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const roles = mysqlTable("roles", {
  id: int("id")
    .autoincrement()
    .primaryKey(),

  name: varchar("name", {
    length: 50,
  })
    .notNull()
    .unique(),

  description: text("description"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),
});