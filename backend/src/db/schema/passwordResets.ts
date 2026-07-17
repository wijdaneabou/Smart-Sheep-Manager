import {
  mysqlTable,
  int,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/mysql-core";

import { users } from "./users.js";

export const passwordResets = mysqlTable(
  "password_resets",
  {
    id: int("id")
      .autoincrement()
      .primaryKey(),

    userId: int("user_id")
      .notNull()
      .references(() => users.id),

    code: varchar("code", {
      length: 6,
    }).notNull(),

    expiresAt: timestamp("expires_at")
      .notNull(),

    used: boolean("used")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  }
);