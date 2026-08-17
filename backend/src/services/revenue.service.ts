// backend/src/services/revenue.service.ts

import { db } from '../db/connection.js';
import { revenues, type Revenue, type NewRevenue } from '../db/schema/index.js';
import { getUserExploitationIds } from '../utils/permissions.js';
import { eq, inArray, and, between, desc, sql } from 'drizzle-orm';

export class RevenueService {
  async getRevenues(
    userId: number,
    roleName: string,
    filters?: { startDate?: Date; endDate?: Date; type?: string }
  ) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return [];

    let conditions: any[] = [inArray(revenues.exploitationId, allowedIds)];

    if (filters?.startDate && filters?.endDate) {
      conditions.push(between(revenues.date, filters.startDate, filters.endDate));
    } else if (filters?.startDate) {
      conditions.push(sql`${revenues.date} >= ${filters.startDate}`);
    } else if (filters?.endDate) {
      conditions.push(sql`${revenues.date} <= ${filters.endDate}`);
    }
    if (filters?.type) {
      conditions.push(eq(revenues.type, filters.type as any));
    }

    return await db
      .select()
      .from(revenues)
      .where(and(...conditions))
      .orderBy(desc(revenues.date));
  }

  async getRevenueById(id: number, userId: number, roleName: string) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.length) return null;

    const [revenue] = await db
      .select()
      .from(revenues)
      .where(
        and(
          eq(revenues.id, id),
          inArray(revenues.exploitationId, allowedIds)
        )
      );
    return revenue || null;
  }

  async createRevenue(userId: number, roleName: string, data: NewRevenue) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    if (!allowedIds.includes(data.exploitationId)) {
      throw new Error('Accès non autorisé à cette exploitation');
    }

    const [inserted] = await db
      .insert(revenues)
      .values({
        ...data,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const [created] = await db
      .select()
      .from(revenues)
      .where(eq(revenues.id, inserted.id));
    return created;
  }

  async updateRevenue(id: number, userId: number, roleName: string, data: Partial<NewRevenue>) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    const [existing] = await db
      .select()
      .from(revenues)
      .where(
        and(
          eq(revenues.id, id),
          inArray(revenues.exploitationId, allowedIds)
        )
      );

    if (!existing) {
      throw new Error('Revenu non trouvé ou accès non autorisé');
    }

    if (data.exploitationId && !allowedIds.includes(data.exploitationId)) {
      throw new Error('Accès non autorisé à la nouvelle exploitation');
    }

    await db
      .update(revenues)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(revenues.id, id));

    const [updated] = await db
      .select()
      .from(revenues)
      .where(eq(revenues.id, id));
    return updated;
  }

  async deleteRevenue(id: number, userId: number, roleName: string) {
    const allowedIds = await getUserExploitationIds(userId, roleName);
    const [existing] = await db
      .select()
      .from(revenues)
      .where(
        and(
          eq(revenues.id, id),
          inArray(revenues.exploitationId, allowedIds)
        )
      );

    if (!existing) {
      throw new Error('Revenu non trouvé ou accès non autorisé');
    }

    await db.delete(revenues).where(eq(revenues.id, id));
    return true;
  }
}