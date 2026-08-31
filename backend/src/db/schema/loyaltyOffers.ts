import { mysqlTable, int, varchar, text, decimal, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";
import { clientSegments } from "./clientSegments.js";

export const loyaltyOffers = mysqlTable("loyalty_offers", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["VOLUME_DISCOUNT", "TARGETED_OFFER"]).notNull(),
  segmentId: int("segment_id").references(() => clientSegments.id, { onDelete: "set null" }),
  minQuantity: int("min_quantity").default(1),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }),
  validFrom: timestamp("valid_from").notNull(),
  validTo: timestamp("valid_to").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
