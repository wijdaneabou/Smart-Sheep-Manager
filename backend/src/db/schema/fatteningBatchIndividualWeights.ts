import {
  mysqlTable,
  int,
  varchar,
  decimal,
  date,
  text,
  timestamp,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { fatteningBatches } from "./fatteningBatches.js";
import { animals } from "./animals.js";

export const fatteningBatchIndividualWeights = mysqlTable(
  "fattening_batch_individual_weights",
  {
    id: int("id").autoincrement().primaryKey(),

    fatteningBatchId: int("fattening_batch_id").notNull(),

    animalId: int("animal_id"),

    weight: decimal("weight", { precision: 6, scale: 2 }).notNull(),

    date: date("date").notNull(),

    note: text("note"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    batchFk: foreignKey({
      columns: [table.fatteningBatchId],
      foreignColumns: [fatteningBatches.id],
      name: "fk_fiw_batch",
    }).onDelete("cascade"),
    animalFk: foreignKey({
      columns: [table.animalId],
      foreignColumns: [animals.id],
      name: "fk_fiw_animal",
    }).onDelete("set null"),
  })
);

export const fatteningBatchIndividualWeightsRelations = relations(
  fatteningBatchIndividualWeights,
  ({ one }) => ({
    batch: one(fatteningBatches, {
      fields: [fatteningBatchIndividualWeights.fatteningBatchId],
      references: [fatteningBatches.id],
    }),
    animal: one(animals, {
      fields: [fatteningBatchIndividualWeights.animalId],
      references: [animals.id],
    }),
  })
);
