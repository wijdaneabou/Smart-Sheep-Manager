import {
  mysqlTable,
  int,
  varchar,
  mysqlEnum,
  text,
  timestamp,
} from "drizzle-orm/mysql-core";

export const listingStatuses = [
  "DRAFT",
  "PUBLISHED",
  "SOLD",
  "ARCHIVED",
] as const;

export const transactionStatuses = [
  "PENDING",
  "ESCROW",
  "PAID",
  "COMPLETED",
  "CANCELLED",
] as const;

export const marketplaceListings = mysqlTable("marketplace_listings", {
  id: int("id").autoincrement().primaryKey(),

  animalId: int("animal_id"),

  sellerId: int("seller_id").notNull(),

  sellerName: varchar("seller_name", { length: 120 }).notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),

  price: varchar("price", { length: 50 }).notNull(),

  currency: varchar("currency", { length: 10 }).notNull().default("MAD"),

  location: varchar("location", { length: 255 }),

  status: mysqlEnum("status", listingStatuses).notNull().default("DRAFT"),

  photos: text("photos"),

  specifications: text("specifications"),

  viewsCount: int("views_count").default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const marketplaceMessages = mysqlTable("marketplace_messages", {
  id: int("id").autoincrement().primaryKey(),

  listingId: int("listing_id").notNull(),

  senderId: int("sender_id").notNull(),

  receiverId: int("receiver_id").notNull(),

  message: text("message").notNull(),

  readAt: timestamp("read_at"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceRatings = mysqlTable("marketplace_ratings", {
  id: int("id").autoincrement().primaryKey(),

  listingId: int("listing_id").notNull(),

  raterId: int("rater_id").notNull(),

  ratedUserId: int("rated_user_id").notNull(),

  rating: int("rating").notNull(),

  comment: text("comment"),

  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceTransactions = mysqlTable("marketplace_transactions", {
  id: int("id").autoincrement().primaryKey(),

  listingId: int("listing_id").notNull(),

  buyerId: int("buyer_id").notNull(),

  sellerId: int("seller_id").notNull(),

  amount: varchar("amount", { length: 50 }).notNull(),

  status: mysqlEnum("status", transactionStatuses).notNull().default("PENDING"),

  escrowReference: varchar("escrow_reference", { length: 120 }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
