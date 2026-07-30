import {
  mysqlTable,
  int,
  text,
  decimal,
  date,
  timestamp,
} from "drizzle-orm/mysql-core";
import { animals } from "./animals.js";

export const animalWeightRecords = mysqlTable("animal_weight_records", {
  id: int("id").autoincrement().primaryKey(),

  // Animal concerné
  animalId: int("animal_id")
    .references(() => animals.id, { onDelete: "cascade" })
    .notNull(),

  // Poids en kg
  weight: decimal("weight", { precision: 6, scale: 2 }).notNull(),

  // Score de condition corporelle (1.0 - 5.0)
  bcs: decimal("bcs", { precision: 3, scale: 1 }),

  // Date de la mesure
  date: date("date").notNull(),

  // Note libre
  note: text("note"),

  createdAt: timestamp("created_at").defaultNow(),
});
