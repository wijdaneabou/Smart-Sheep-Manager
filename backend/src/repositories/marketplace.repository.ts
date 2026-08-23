import { db } from "../db/connection.js";
import {
  marketplaceListings,
  marketplaceMessages,
  marketplaceRatings,
  marketplaceTransactions,
} from "../db/schema/marketplace.js";
import {
  eq,
  and,
  like,
  desc,
  count,
  sql,
  inArray,
} from "drizzle-orm";

type MarketplaceListing = typeof marketplaceListings.$inferSelect;
type MarketplaceMessage = typeof marketplaceMessages.$inferSelect;
type MarketplaceRating = typeof marketplaceRatings.$inferSelect;
type MarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;

export type {
  MarketplaceListing,
  MarketplaceMessage,
  MarketplaceRating,
  MarketplaceTransaction,
};

type CreateListingData = typeof marketplaceListings.$inferInsert;
type UpdateListingData = Partial<CreateListingData>;
type CreateMessageData = typeof marketplaceMessages.$inferInsert;
type CreateRatingData = typeof marketplaceRatings.$inferInsert;
type CreateTransactionData = typeof marketplaceTransactions.$inferInsert;

export async function findListingById(id: number): Promise<MarketplaceListing | null> {
  const rows = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, id)).limit(1);
  return rows[0] || null;
}

export async function createListing(data: CreateListingData): Promise<MarketplaceListing> {
  const [result] = await db.insert(marketplaceListings).values(data).$returningId();
  const rows = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, result.id)).limit(1);
  return rows[0];
}

export async function updateListing(id: number, data: UpdateListingData): Promise<MarketplaceListing | null> {
  await db.update(marketplaceListings).set({ ...data, updatedAt: new Date() }).where(eq(marketplaceListings.id, id));
  const rows = await db.select().from(marketplaceListings).where(eq(marketplaceListings.id, id)).limit(1);
  return rows[0] || null;
}

export async function deleteListing(id: number): Promise<void> {
  await db.delete(marketplaceListings).where(eq(marketplaceListings.id, id));
}

export async function listListings(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sellerId?: number;
}) {
  const conditions = [];

  if (params.search) {
    conditions.push(like(marketplaceListings.title, `%${params.search}%`));
  }

  if (params.status) {
    conditions.push(eq(marketplaceListings.status, params.status as any));
  }

  if (params.sellerId) {
    conditions.push(eq(marketplaceListings.sellerId, params.sellerId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(marketplaceListings)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(marketplaceListings.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(marketplaceListings).where(whereClause);

  return { rows, total };
}

export async function incrementListingViews(id: number): Promise<void> {
  await db.update(marketplaceListings).set({ viewsCount: sql`${marketplaceListings.viewsCount} + 1` }).where(eq(marketplaceListings.id, id));
}

export async function findMessageById(id: number): Promise<MarketplaceMessage | null> {
  const rows = await db.select().from(marketplaceMessages).where(eq(marketplaceMessages.id, id)).limit(1);
  return rows[0] || null;
}

export async function createMessage(data: CreateMessageData): Promise<MarketplaceMessage> {
  const [result] = await db.insert(marketplaceMessages).values(data).$returningId();
  const rows = await db.select().from(marketplaceMessages).where(eq(marketplaceMessages.id, result.id)).limit(1);
  return rows[0];
}

export async function listMessages(params: {
  listingId: number;
  page: number;
  limit: number;
  userId?: number;
}) {
  const conditions = [eq(marketplaceMessages.listingId, params.listingId)];

  if (params.userId) {
    conditions.push(
      inArray(marketplaceMessages.senderId, [params.userId])
    );
  }

  const whereClause = and(...conditions);
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(marketplaceMessages)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(marketplaceMessages.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(marketplaceMessages).where(whereClause);

  return { rows, total };
}

export async function markMessageAsRead(id: number): Promise<void> {
  await db.update(marketplaceMessages).set({ readAt: new Date() }).where(eq(marketplaceMessages.id, id));
}

export async function createRating(data: CreateRatingData): Promise<MarketplaceRating> {
  const [result] = await db.insert(marketplaceRatings).values(data).$returningId();
  const rows = await db.select().from(marketplaceRatings).where(eq(marketplaceRatings.id, result.id)).limit(1);
  return rows[0];
}

export async function listRatings(params: {
  listingId?: number;
  ratedUserId?: number;
  page: number;
  limit: number;
}) {
  const conditions = [];

  if (params.listingId) {
    conditions.push(eq(marketplaceRatings.listingId, params.listingId));
  }

  if (params.ratedUserId) {
    conditions.push(eq(marketplaceRatings.ratedUserId, params.ratedUserId));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(marketplaceRatings)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(marketplaceRatings.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(marketplaceRatings).where(whereClause);

  return { rows, total };
}

export async function findTransactionById(id: number): Promise<MarketplaceTransaction | null> {
  const rows = await db.select().from(marketplaceTransactions).where(eq(marketplaceTransactions.id, id)).limit(1);
  return rows[0] || null;
}

export async function createTransaction(data: CreateTransactionData): Promise<MarketplaceTransaction> {
  const [result] = await db.insert(marketplaceTransactions).values(data).$returningId();
  const rows = await db.select().from(marketplaceTransactions).where(eq(marketplaceTransactions.id, result.id)).limit(1);
  return rows[0];
}

export async function updateTransaction(id: number, data: Partial<CreateTransactionData>): Promise<MarketplaceTransaction | null> {
  await db.update(marketplaceTransactions).set({ ...data, updatedAt: new Date() }).where(eq(marketplaceTransactions.id, id));
  const rows = await db.select().from(marketplaceTransactions).where(eq(marketplaceTransactions.id, id)).limit(1);
  return rows[0] || null;
}
