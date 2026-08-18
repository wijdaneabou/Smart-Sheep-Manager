import {
  mysqlTable,
  int,
  varchar,
  decimal,
  date,
  timestamp,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { fatteningBatches } from "./fatteningBatches.js";

export const fatteningBatchCosts = mysqlTable(
  "fattening_batch_costs",
  {
    id: int("id").autoincrement().primaryKey(),

    fatteningBatchId: int("fattening_batch_id").notNull(),

    category: varchar("category", { length: 80 }).notNull(),

    description: varchar("description", { length: 255 }),

    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),

    date: date("date").notNull(),

    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    batchFk: foreignKey({
      columns: [table.fatteningBatchId],
      foreignColumns: [fatteningBatches.id],
      name: "fk_fbc_batch",
    }).onDelete("cascade"),
  })
);

export const fatteningBatchCostsRelations = relations(
  fatteningBatchCosts,
  ({ one }) => ({
    batch: one(fatteningBatches, {
      fields: [fatteningBatchCosts.fatteningBatchId],
      references: [fatteningBatches.id],
    }),
  })
);
