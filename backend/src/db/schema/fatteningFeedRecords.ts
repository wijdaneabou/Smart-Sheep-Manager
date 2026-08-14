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

export const fatteningFeedRecords = mysqlTable(
  "fattening_feed_records",
  {
    id: int("id").autoincrement().primaryKey(),

    fatteningBatchId: int("fattening_batch_id").notNull(),

    date: date("date").notNull(),

    feedType: varchar("feed_type", { length: 120 }).notNull(),

    quantityKg: decimal("quantity_kg", { precision: 10, scale: 3 }).notNull(),

    unitPrice: decimal("unit_price", { precision: 12, scale: 3 }).notNull(),

    totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),

    note: text("note"),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    batchFk: foreignKey({
      columns: [table.fatteningBatchId],
      foreignColumns: [fatteningBatches.id],
      name: "fk_ffr_batch",
    }).onDelete("cascade"),
  })
);

export const fatteningFeedRecordsRelations = relations(
  fatteningFeedRecords,
  ({ one }) => ({
    batch: one(fatteningBatches, {
      fields: [fatteningFeedRecords.fatteningBatchId],
      references: [fatteningBatches.id],
    }),
  })
);
