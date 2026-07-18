import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  timestamp,
  datetime,
} from "drizzle-orm/mysql-core";
import { exploitations } from "./exploitations.js";

export const users = mysqlTable("users", {
  id: int("id")
    .autoincrement()
    .primaryKey(),

  firstName: varchar("first_name", {
    length: 100,
  }).notNull(),

  lastName: varchar("last_name", {
    length: 100,
  }).notNull(),

  email: varchar("email", {
    length: 150,
  })
    .notNull()
    .unique(),

  phone: varchar("phone", {
    length: 20,
  }),

  password: varchar("password", {
    length: 255,
  }).notNull(),

  photo: varchar("photo", {
    length: 255,
  }),

  roleId: int("role_id").notNull(),

  // NOUVEAU (US-1.2) : assignation a une exploitation
  exploitationId: int("exploitation_id").references(() => exploitations.id),

  status: mysqlEnum("status", [
    "ACTIVE",
    "INACTIVE",
    "SUSPENDED",
  ]).default("ACTIVE"),

  lastLogin: timestamp("last_login"),

  failedAttempts: int("failed_attempts")
    .notNull()
    .default(0),

  lockedUntil: datetime("locked_until"),

  createdAt: timestamp("created_at")
    .defaultNow(),

  updatedAt: timestamp("updated_at")
    .defaultNow(),
});