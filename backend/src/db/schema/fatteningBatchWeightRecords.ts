import {
  mysqlTable,
  int,
  decimal,
  date,
  text,
  timestamp,
  varchar,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { fatteningBatches } from "./fatteningBatches.js";

export const fatteningBatchWeightRecords = mysqlTable(
  "fattening_batch_weight_records",
  {
    id: int("id").autoincrement().primaryKey(),

    fatteningBatchId: int("fattening_batch_id").notNull(),

    averageWeight: decimal("average_weight", {
      precision: 6,
      scale: 2,
    }).notNull(),

    date: date("date").notNull(),

    note: text("note"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    batchFk: foreignKey({
      columns: [table.fatteningBatchId],
      foreignColumns: [fatteningBatches.id],
      name: "fk_fbw_batch",
    }).onDelete("cascade"),
  })
);

export const fatteningBatchWeightRecordsRelations = relations(
  fatteningBatchWeightRecords,
  ({ one }) => ({
    batch: one(fatteningBatches, {
      fields: [fatteningBatchWeightRecords.fatteningBatchId],
      references: [fatteningBatches.id],
    }),
  })
);