import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const contractStatuses = [
  "EN_NEGOCIATION",
  "ACTIF",
  "EXPIRE",
  "RESILIE",
] as const;

export const frameworkContracts = mysqlTable("framework_contracts", {
  id: int("id").autoincrement().primaryKey(),

  contractNumber: varchar("contract_number", { length: 50 }).notNull().unique(),

  status: mysqlEnum("status", contractStatuses).notNull().default("EN_NEGOCIATION"),

  clientId: int("client_id").notNull(),

  clientName: varchar("client_name", { length: 120 }).notNull(),

  monthlyVolume: varchar("monthly_volume", { length: 50 }).notNull(),

  yearlyVolume: varchar("yearly_volume", { length: 50 }).notNull(),

  negotiatedPrice: varchar("negotiated_price", { length: 50 }).notNull(),

  startDate: varchar("start_date", { length: 20 }).notNull(),

  endDate: varchar("end_date", { length: 20 }).notNull(),

  clauses: text("clauses"),

  schedule: text("schedule"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
