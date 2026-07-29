import { date, decimal, int, mysqlEnum, mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";
import { exploitations } from "./exploitations.js";

export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  exploitationId: int("exploitation_id").notNull().references(() => exploitations.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 150 }),
  position: varchar("position", { length: 100 }).notNull(),
  status: mysqlEnum("status", ["ACTIVE", "INACTIVE"]).notNull().default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employmentContracts = mysqlTable("employment_contracts", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["CDI", "CDD", "TEMPORAIRE", "SAISONNIER"]).notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workSchedules = mysqlTable("work_schedules", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  workDate: date("work_date", { mode: "string" }).notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  endTime: varchar("end_time", { length: 5 }).notNull(),
  task: varchar("task", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["PLANNED", "DONE", "CANCELLED"]).notNull().default("PLANNED"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workHours = mysqlTable("work_hours", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  workDate: date("work_date", { mode: "string" }).notNull(),
  hours: decimal("hours", { precision: 5, scale: 2 }).notNull(),
  overtimeHours: decimal("overtime_hours", { precision: 5, scale: 2 }).notNull().default("0"),
  note: varchar("note", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});
