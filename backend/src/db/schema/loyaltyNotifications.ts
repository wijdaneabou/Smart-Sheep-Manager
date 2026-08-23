import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";
import { clients } from "./clients.js";
import { clientSegments } from "./clientSegments.js";

export const loyaltyNotifications = mysqlTable("loyalty_notifications", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 150 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["AVAILABILITY", "PRICE_DROP", "NEW_ARRIVAL"]).notNull(),
  clientId: int("client_id").references(() => clients.id, { onDelete: "cascade" }),
  segmentId: int("segment_id").references(() => clientSegments.id, { onDelete: "set null" }),
  isRead: boolean("is_read").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
