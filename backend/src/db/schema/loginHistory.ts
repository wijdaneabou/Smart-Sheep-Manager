import {
  mysqlTable,
  int,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/mysql-core";
import { users } from "./users.js";

export const loginHistory = mysqlTable("login_history", {
  id: int("id").autoincrement().primaryKey(),

  userId: int("user_id")
    .notNull()
    .references(() => users.id),

  ip: varchar("ip", { length: 45 }),

  userAgent: varchar("user_agent", { length: 255 }),

  success: boolean("success").notNull().default(true),

  loginAt: timestamp("login_at").defaultNow(),
});