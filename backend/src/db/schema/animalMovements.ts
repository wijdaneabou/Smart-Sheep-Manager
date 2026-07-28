import {
  mysqlTable,
  int,
  varchar,
  text,
  mysqlEnum,
  decimal,
  date,
  timestamp,
} from "drizzle-orm/mysql-core";
import { animals } from "./animals.js";
import { relations } from "drizzle-orm";

export const animalMovements = mysqlTable("animal_movements", {
  id: int("id").autoincrement().primaryKey(),

  // Animal concerné
  animalId: int("animal_id")
    .references(() => animals.id, { onDelete: "cascade" })
    .notNull(),

  // Type de mouvement
  type: mysqlEnum("type", [
    "ENTRY",
    "EXIT",
    "DEATH",
    "SALE",
    "PURCHASE",
  ]).notNull(),

  // Date du mouvement
  date: date("date").notNull(),

  // Raison du mouvement
  reason: text("reason"),

  // Provenance / Destination
  sourceDestination: varchar("source_destination", { length: 200 }),

  // Prix (pour vente / achat)
  price: decimal("price", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow(),
});
export const animalMovementsRelations = relations(
  animalMovements,
  ({ one }) => ({
    animal: one(animals, {
      fields: [animalMovements.animalId],
      references: [animals.id],
    }),
  })
);