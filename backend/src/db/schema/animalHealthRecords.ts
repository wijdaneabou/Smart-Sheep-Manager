import {
  mysqlTable,
  int,
  varchar,
  text,
  mysqlEnum,
  date,
  timestamp,
} from "drizzle-orm/mysql-core";
import { animals } from "./animals.js";

export const animalHealthRecords = mysqlTable("animal_health_records", {
  id: int("id").autoincrement().primaryKey(),

  // Animal concerné
  animalId: int("animal_id")
    .references(() => animals.id, { onDelete: "cascade" })
    .notNull(),

  // Catégorie d'événement
  category: mysqlEnum("category", [
    "HEALTH_CHECK",
    "TREATMENT",
    "VACCINATION",
    "ILLNESS",
  ]).notNull(),

  // Titre court (ex: "Vaccination anti-malignité")
  title: varchar("title", { length: 200 }).notNull(),

  // Description détaillée
  description: text("description"),

  // Vétérinaire traitant
  veterinarian: varchar("veterinarian", { length: 100 }),

  // Médicament appliqué
  medication: varchar("medication", { length: 200 }),

  // Dosage (ex: "2 ml")
  dosage: varchar("dosage", { length: 100 }),

  // Date de l'événement
  date: date("date").notNull(),

  // Statut de l'événement
  status: mysqlEnum("status", ["COMPLETED", "ONGOING", "RECOVERING"])
    .default("COMPLETED"),

  createdAt: timestamp("created_at").defaultNow(),
});
