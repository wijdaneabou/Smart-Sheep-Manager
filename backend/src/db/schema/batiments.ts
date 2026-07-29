import {
  mysqlTable,
  int,
  varchar,
  text,
  decimal,
  mysqlEnum,
  timestamp,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { exploitations } from "./exploitations.js";

export const batiments = mysqlTable("batiments", {
  id: int("id").autoincrement().primaryKey(),

  exploitationId: int("exploitation_id")
    .notNull()
    .references((): AnyMySqlColumn => exploitations.id),

  name: varchar("name", { length: 150 }).notNull(),

  type: mysqlEnum("type", [
    "BERGERIE",
    "STABULATION",
    "BOX",
    "PARC",
    "PARCELLE",
  ]).notNull(),

  // Nombre d'animaux que la structure peut accueillir
  capacite: int("capacite"),

  // Superficie en m2 pour un batiment, en ha pour une parcelle (unite geree cote UI)
  superficie: decimal("superficie", { precision: 10, scale: 2 }),

  // Liste d'equipements stockee en JSON (ex: ["Abreuvoir", "Mangeoire", "Eclairage"])
  equipements: text("equipements"),

  etat: mysqlEnum("etat", ["BON", "MOYEN", "MAUVAIS"]).notNull().default("BON"),

  // Occupation actuelle : nombre d'animaux presents actuellement.
  // Saisie manuelle pour l'instant, sera calculee automatiquement une fois
  // le Module 3 (Gestion du Troupeau) realise.
  occupationActuelle: int("occupation_actuelle").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});