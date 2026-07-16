import {
  mysqlTable,
  int,
  varchar,
  timestamp,
} from "drizzle-orm/mysql-core";

export const refreshTokens = mysqlTable("refresh_tokens", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("user_id").notNull(),

  token: varchar("token", {
    length: 500,
  }).notNull(),

  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});