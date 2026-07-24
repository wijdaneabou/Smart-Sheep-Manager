import {
  mysqlTable,
  int,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";

import { users } from "./users.js";

export const userSessions = mysqlTable("user_sessions", {
  id: int("id")
    .primaryKey()
    .autoincrement(),

  userId: int("user_id")
    .notNull()
    .references(() => users.id, {
      onDelete: "cascade",
    }),

  refreshToken: varchar("refresh_token", {
    length: 500,
  }).notNull(),

  ip: varchar("ip", {
    length: 100,
  }),

  userAgent: text("user_agent"),

  loginAt: timestamp("login_at")
    .defaultNow()
    .notNull(),

  logoutAt: timestamp("logout_at", {
    mode: "date",
    }),

  isActive: boolean("is_active")
    .default(true)
    .notNull(),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});