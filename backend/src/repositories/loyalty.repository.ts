import { db } from "../db/connection.js";
import {
  clientSegments,
  clientLoyaltyProfiles,
  loyaltyOffers,
  loyaltyNotifications,
  clients,
} from "../db/schema/index.js";
import { eq, and, like, desc, count, sql, asc } from "drizzle-orm";

type ClientSegment = typeof clientSegments.$inferSelect;
type CreateClientSegmentData = typeof clientSegments.$inferInsert;
type UpdateClientSegmentData = Partial<CreateClientSegmentData>;

type ClientLoyaltyProfile = typeof clientLoyaltyProfiles.$inferSelect;
type CreateClientLoyaltyProfileData = typeof clientLoyaltyProfiles.$inferInsert;
type UpdateClientLoyaltyProfileData = Partial<CreateClientLoyaltyProfileData>;

type LoyaltyOffer = typeof loyaltyOffers.$inferSelect;
type CreateLoyaltyOfferData = typeof loyaltyOffers.$inferInsert;
type UpdateLoyaltyOfferData = Partial<CreateLoyaltyOfferData>;

type LoyaltyNotification = typeof loyaltyNotifications.$inferSelect;
type CreateLoyaltyNotificationData = typeof loyaltyNotifications.$inferInsert;
type UpdateLoyaltyNotificationData = Partial<CreateLoyaltyNotificationData>;

// ---- Client Segments ----

export async function findClientSegmentById(id: number): Promise<ClientSegment | null> {
  const rows = await db.select().from(clientSegments).where(eq(clientSegments.id, id)).limit(1);
  return rows[0] || null;
}

export async function createClientSegment(data: CreateClientSegmentData): Promise<ClientSegment> {
  const [result] = await db.insert(clientSegments).values(data).$returningId();
  return findClientSegmentById(result.id) as Promise<ClientSegment>;
}

export async function updateClientSegment(id: number, data: UpdateClientSegmentData): Promise<ClientSegment | null> {
  await db.update(clientSegments).set({ ...data, updatedAt: new Date() }).where(eq(clientSegments.id, id));
  return findClientSegmentById(id);
}

export async function deleteClientSegment(id: number): Promise<void> {
  await db.delete(clientSegments).where(eq(clientSegments.id, id));
}

export async function listClientSegments(params: {
  page: number;
  limit: number;
  search?: string;
  active?: boolean;
}) {
  const conditions = [];
  if (params.search) {
    conditions.push(like(clientSegments.name, `%${params.search}%`));
  }
  if (params.active !== undefined) {
    conditions.push(eq(clientSegments.isActive, params.active));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(clientSegments)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(clientSegments.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(clientSegments).where(whereClause);
  return { rows, total };
}

// ---- Client Loyalty Profiles ----

export async function findLoyaltyProfileByClientId(clientId: number): Promise<ClientLoyaltyProfile | null> {
  const rows = await db
    .select()
    .from(clientLoyaltyProfiles)
    .where(eq(clientLoyaltyProfiles.clientId, clientId))
    .limit(1);
  return rows[0] || null;
}

export async function createLoyaltyProfile(data: CreateClientLoyaltyProfileData): Promise<ClientLoyaltyProfile> {
  const [result] = await db.insert(clientLoyaltyProfiles).values(data).$returningId();
  return findLoyaltyProfileByClientId(data.clientId) as Promise<ClientLoyaltyProfile>;
}

export async function updateLoyaltyProfile(clientId: number, data: UpdateClientLoyaltyProfileData): Promise<ClientLoyaltyProfile | null> {
  await db
    .update(clientLoyaltyProfiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clientLoyaltyProfiles.clientId, clientId));
  return findLoyaltyProfileByClientId(clientId);
}

export async function listLoyaltyProfiles(params: {
  page: number;
  limit: number;
  search?: string;
  segmentId?: number;
}) {
  const conditions = [];
  if (params.search) {
    conditions.push(like(clients.name, `%${params.search}%`));
  }
  if (params.segmentId) {
    conditions.push(eq(clientLoyaltyProfiles.segmentId, params.segmentId));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(clientLoyaltyProfiles)
    .leftJoin(clients, eq(clientLoyaltyProfiles.clientId, clients.id))
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(clientLoyaltyProfiles.score), desc(clientLoyaltyProfiles.totalSpent));

  const [{ total }] = await db
    .select({ total: count() })
    .from(clientLoyaltyProfiles)
    .leftJoin(clients, eq(clientLoyaltyProfiles.clientId, clients.id))
    .where(whereClause);

  return { rows: rows.map(r => ({ ...r.client_loyalty_profiles, client: r.clients })), total };
}

// ---- Loyalty Offers ----

export async function findLoyaltyOfferById(id: number): Promise<LoyaltyOffer | null> {
  const rows = await db.select().from(loyaltyOffers).where(eq(loyaltyOffers.id, id)).limit(1);
  return rows[0] || null;
}

export async function createLoyaltyOffer(data: CreateLoyaltyOfferData): Promise<LoyaltyOffer> {
  const [result] = await db.insert(loyaltyOffers).values(data).$returningId();
  return findLoyaltyOfferById(result.id) as Promise<LoyaltyOffer>;
}

export async function updateLoyaltyOffer(id: number, data: UpdateLoyaltyOfferData): Promise<LoyaltyOffer | null> {
  await db.update(loyaltyOffers).set({ ...data, updatedAt: new Date() }).where(eq(loyaltyOffers.id, id));
  return findLoyaltyOfferById(id);
}

export async function deleteLoyaltyOffer(id: number): Promise<void> {
  await db.delete(loyaltyOffers).where(eq(loyaltyOffers.id, id));
}

export async function listLoyaltyOffers(params: {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  segmentId?: number;
  active?: boolean;
}) {
  const conditions = [];
  if (params.search) {
    conditions.push(like(loyaltyOffers.title, `%${params.search}%`));
  }
  if (params.type) {
    conditions.push(eq(loyaltyOffers.type, params.type as any));
  }
  if (params.segmentId) {
    conditions.push(eq(loyaltyOffers.segmentId, params.segmentId));
  }
  if (params.active !== undefined) {
    conditions.push(eq(loyaltyOffers.isActive, params.active));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(loyaltyOffers)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(loyaltyOffers.validFrom));

  const [{ total }] = await db.select({ total: count() }).from(loyaltyOffers).where(whereClause);
  return { rows, total };
}

// ---- Loyalty Notifications ----

export async function findLoyaltyNotificationById(id: number): Promise<LoyaltyNotification | null> {
  const rows = await db.select().from(loyaltyNotifications).where(eq(loyaltyNotifications.id, id)).limit(1);
  return rows[0] || null;
}

export async function createLoyaltyNotification(data: CreateLoyaltyNotificationData): Promise<LoyaltyNotification> {
  const [result] = await db.insert(loyaltyNotifications).values(data).$returningId();
  return findLoyaltyNotificationById(result.id) as Promise<LoyaltyNotification>;
}

export async function markNotificationAsRead(id: number): Promise<LoyaltyNotification | null> {
  await db.update(loyaltyNotifications).set({ isRead: true, updatedAt: new Date() }).where(eq(loyaltyNotifications.id, id));
  return findLoyaltyNotificationById(id);
}

export async function listLoyaltyNotifications(params: {
  page: number;
  limit: number;
  type?: string;
  clientId?: number;
  segmentId?: number;
  unreadOnly?: boolean;
}) {
  const conditions = [];
  if (params.type) {
    conditions.push(eq(loyaltyNotifications.type, params.type as any));
  }
  if (params.clientId) {
    conditions.push(eq(loyaltyNotifications.clientId, params.clientId));
  }
  if (params.segmentId) {
    conditions.push(eq(loyaltyNotifications.segmentId, params.segmentId));
  }
  if (params.unreadOnly) {
    conditions.push(eq(loyaltyNotifications.isRead, false));
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;
  const offset = (params.page - 1) * params.limit;

  const rows = await db
    .select()
    .from(loyaltyNotifications)
    .where(whereClause)
    .limit(params.limit)
    .offset(offset)
    .orderBy(desc(loyaltyNotifications.createdAt));

  const [{ total }] = await db.select({ total: count() }).from(loyaltyNotifications).where(whereClause);
  return { rows, total };
}
