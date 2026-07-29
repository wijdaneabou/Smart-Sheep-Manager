import { date, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { exploitations } from "./exploitations.js";

export const agriculturalEvents = mysqlTable("agricultural_events", {
  id: int("id").autoincrement().primaryKey(),
  exploitationId: int("exploitation_id").notNull().references(() => exploitations.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["VACCINATION", "TRAITEMENT", "PESEE", "MISE_BAS", "AUTRE"]).notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  eventDate: date("event_date", { mode: "string" }).notNull(),
  gestationWeek: int("gestation_week"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
