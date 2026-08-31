import { mysqlTable, int, decimal, timestamp, boolean } from "drizzle-orm/mysql-core";
import { clients } from "./clients.js";
import { clientSegments } from "./clientSegments.js";

export const clientLoyaltyProfiles = mysqlTable("client_loyalty_profiles", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  score: int("score").default(0),
  purchaseFrequency: int("purchase_frequency").default(0),
  averageBasket: decimal("average_basket", { precision: 12, scale: 2 }).default("0"),
  totalPurchases: int("total_purchases").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  lastPurchaseAt: timestamp("last_purchase_at"),
  segmentId: int("segment_id").references(() => clientSegments.id, { onDelete: "set null" }),
  autoSegment: boolean("auto_segment").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
