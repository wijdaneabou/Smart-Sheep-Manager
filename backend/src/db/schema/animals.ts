import {
  mysqlTable,
  int,
  varchar,
  decimal,
  mysqlEnum,
  date,
  timestamp,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { exploitations } from "./exploitations.js";
import { relations } from "drizzle-orm";
import { animalMovements } from "./animalMovements.js";

export const animals = mysqlTable("animals", {
  id: int("id").autoincrement().primaryKey(),

  // Numéro d'électron libre (ex: MA202600001245)
  rfid: varchar("rfid", { length: 50 }).notNull().unique(),

  // Nom de l'animal
  name: varchar("name", { length: 100 }).notNull(),

  // Race (Sardi, Timahdite, D'man, Beni-Guil)
  breed: mysqlEnum("breed", ["Sardi", "Timahdite", "D'man", "Beni-Guil"]).notNull(),

  // Sexe
  sex: mysqlEnum("sex", ["MALE", "FEMALE"]).notNull(),

  // Date de naissance
  birthDate: date("birth_date"),

  // Pére (auto-référence)
  fatherId: int("father_id").references((): AnyMySqlColumn => animals.id),

  // Mère (auto-référence)
  motherId: int("mother_id").references((): AnyMySqlColumn => animals.id),

  // Poids en kg
  weight: decimal("weight", { precision: 6, scale: 2 }),

  // Score de condition corporelle (1.0 - 5.0)
  bcs: decimal("bcs", { precision: 3, scale: 1 }),

  // Statut santé
  healthStatus: mysqlEnum("health_status", [
    "HEALTHY",
    "SICK",
    "RECOVERING",
    "DECEASED",
    "QUARANTINE",
  ])
    .notNull()
    .default("HEALTHY"),

  // Chemin/URL de la photo de l'animal (ex: /uploads/animals/xxx.jpg)
  photoUrl: varchar("photo_url", { length: 255 }),

  // Exploitation propriétaire (optionnelle)
  exploitationId: int("exploitation_id").references(
    (): AnyMySqlColumn => exploitations.id
  ),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const animalsRelations = relations(
  animals,
  ({ many }) => ({
    movements: many(animalMovements),
  })
);