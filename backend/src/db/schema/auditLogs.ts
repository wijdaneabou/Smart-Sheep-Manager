import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

import { users } from "./users.js";

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("user_id").references(() => users.id),

  module: varchar("module", { length: 100 }).notNull(),

  action: varchar("action", { length: 100 }).notNull(),

  description: text("description"),

  result: varchar("result", {
    length: 20,
  }).notNull(),

  ip: varchar("ip", {
    length: 45,
  }),

  userAgent: text("user_agent"),

  createdAt: timestamp("created_at").defaultNow(),
});