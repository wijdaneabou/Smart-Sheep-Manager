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

export const animalReproductionRecords = mysqlTable(
  "animal_reproduction_records",
  {
    id: int("id").autoincrement().primaryKey(),

    // Animal concerné
    animalId: int("animal_id")
      .references(() => animals.id, { onDelete: "cascade" })
      .notNull(),

    // Type d'événement de reproduction
    eventType: mysqlEnum("event_type", [
      "BREEDING",
      "PREGNANCY_CHECK",
      "BIRTH",
      "WEANING",
    ]).notNull(),

    // Date de l'événement
    date: date("date").notNull(),

    // Partenaire de reproduction (ID de l'autre animal)
    partnerId: int("partner_id").references(() => animals.id, {
      onDelete: "set null",
    }),

    // Résultat (ex: "Gestation confirmée", "3 agneaux nés")
    result: varchar("result", { length: 200 }),

    // Note libre
    note: text("note"),

    createdAt: timestamp("created_at").defaultNow(),
  }
);
