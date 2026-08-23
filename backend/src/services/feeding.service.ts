import { db } from '../db/connection.js';
import {
  feedItems,
  feedStocks,
  feedRations,
  feedRationItems,
  feedDistributions,
  NewFeedItem,
  NewFeedStock,
  NewFeedRation,
  NewFeedRationItem,
  NewFeedDistribution,
} from '../db/schema/index.js';
import { eq, desc, and, sql, between } from 'drizzle-orm';

export class FeedingService {
  // ============================================
  // US-7.1: Feed Items (Inventaire)
  // ============================================

  async getFeedItems(exploitationId?: number) {
    const conditions: any[] = [];
    if (exploitationId) {
      conditions.push(eq(feedItems.exploitationId, exploitationId));
    }
    return await db
      .select()
      .from(feedItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(feedItems.createdAt));
  }

  async getFeedItemById(id: number) {
    const [item] = await db.select().from(feedItems).where(eq(feedItems.id, id));
    return item;
  }

  async createFeedItem(data: NewFeedItem) {
    const [itemId] = await db
      .insert(feedItems)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const [created] = await db.select().from(feedItems).where(eq(feedItems.id, itemId.id));
    return created;
  }

  async updateFeedItem(id: number, data: Partial<NewFeedItem>) {
    await db
      .update(feedItems)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feedItems.id, id));

    const [item] = await db.select().from(feedItems).where(eq(feedItems.id, id));
    return item;
  }

  async deleteFeedItem(id: number) {
    const [item] = await db.select().from(feedItems).where(eq(feedItems.id, id));
    if (!item) throw new Error('Article alimentaire non trouvé');
    await db.delete(feedItems).where(eq(feedItems.id, id));
  }

  async getLowStockItems(exploitationId?: number) {
    const conditions: any[] = [
      sql`${feedItems.currentStock} <= ${feedItems.minStockThreshold}`,
    ];
    if (exploitationId) {
      conditions.push(eq(feedItems.exploitationId, exploitationId));
    }
    return await db
      .select()
      .from(feedItems)
      .where(and(...conditions))
      .orderBy(feedItems.currentStock);
  }

  // ============================================
  // US-7.2: Feed Stocks (Mouvements)
  // ============================================

  async getFeedStocksByItem(feedItemId: number) {
    return await db
      .select()
      .from(feedStocks)
      .where(eq(feedStocks.feedItemId, feedItemId))
      .orderBy(desc(feedStocks.movementDate));
  }

  async getFeedStockById(id: number) {
    const [stock] = await db.select().from(feedStocks).where(eq(feedStocks.id, id));
    return stock;
  }

  async createFeedStock(data: NewFeedStock) {
    const [stockId] = await db
      .insert(feedStocks)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const feedItem = await this.getFeedItemById(data.feedItemId);
    if (feedItem) {
      let newStock = Number(feedItem.currentStock) || 0;
      if (data.movementType === 'IN') {
        newStock += Number(data.quantity);
      } else if (data.movementType === 'OUT') {
        newStock -= Number(data.quantity);
      } else if (data.movementType === 'ADJUSTMENT') {
        newStock = Number(data.quantity);
      }
      await db
        .update(feedItems)
        .set({ currentStock: newStock as any, updatedAt: new Date() })
        .where(eq(feedItems.id, data.feedItemId));
    }

    const [created] = await db.select().from(feedStocks).where(eq(feedStocks.id, stockId.id));
    return created;
  }

  async updateFeedStock(id: number, data: Partial<NewFeedStock>) {
    await db
      .update(feedStocks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feedStocks.id, id));

    const [stock] = await db.select().from(feedStocks).where(eq(feedStocks.id, id));
    return stock;
  }

  async deleteFeedStock(id: number) {
    const [stock] = await db.select().from(feedStocks).where(eq(feedStocks.id, id));
    if (!stock) throw new Error('Mouvement de stock non trouvé');
    await db.delete(feedStocks).where(eq(feedStocks.id, id));
  }

  // ============================================
  // US-7.3: Feed Rations (Formulation)
  // ============================================

  async getFeedRations(exploitationId?: number) {
    const conditions: any[] = [];
    if (exploitationId) {
      conditions.push(eq(feedRations.exploitationId, exploitationId));
    }
    return await db
      .select()
      .from(feedRations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(feedRations.createdAt));
  }

  async getFeedRationById(id: number) {
    const [ration] = await db.select().from(feedRations).where(eq(feedRations.id, id));
    if (!ration) return null;

    const items = await db
      .select({
        id: feedRationItems.id,
        rationId: feedRationItems.rationId,
        feedItemId: feedRationItems.feedItemId,
        percentage: feedRationItems.percentage,
        quantityKgPerTon: feedRationItems.quantityKgPerTon,
        feedItemName: feedItems.name,
        feedItemCategory: feedItems.category,
        feedItemUnit: feedItems.unit,
        feedItemUnitPrice: feedItems.unitPrice,
      })
      .from(feedRationItems)
      .innerJoin(feedItems, eq(feedRationItems.feedItemId, feedItems.id))
      .where(eq(feedRationItems.rationId, id));

    return { ...ration, items };
  }

  async createFeedRation(data: NewFeedRation & { items?: NewFeedRationItem[] }) {
    const { items, ...rationData } = data;

    const [rationId] = await db
      .insert(feedRations)
      .values({
        ...rationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    if (items && items.length > 0) {
      for (const item of items) {
        await db.insert(feedRationItems).values({
          rationId: rationId.id,
          feedItemId: item.feedItemId,
          percentage: item.percentage,
          quantityKgPerTon: item.quantityKgPerTon,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return await this.getFeedRationById(rationId.id);
  }

  async updateFeedRation(id: number, data: Partial<NewFeedRation> & { items?: NewFeedRationItem[] }) {
    const { items, ...rationData } = data;

    await db
      .update(feedRations)
      .set({ ...rationData, updatedAt: new Date() })
      .where(eq(feedRations.id, id));

    if (items) {
      await db.delete(feedRationItems).where(eq(feedRationItems.rationId, id));
      for (const item of items) {
        await db.insert(feedRationItems).values({
          rationId: id,
          feedItemId: item.feedItemId,
          percentage: item.percentage,
          quantityKgPerTon: item.quantityKgPerTon,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    return await this.getFeedRationById(id);
  }

  async deleteFeedRation(id: number) {
    const [ration] = await db.select().from(feedRations).where(eq(feedRations.id, id));
    if (!ration) throw new Error('Ration non trouvée');
    await db.delete(feedRations).where(eq(feedRations.id, id));
  }

  // ============================================
  // US-7.4: Feed Distributions
  // ============================================

  async getFeedDistributions(filters?: {
    startDate?: string;
    endDate?: string;
    targetType?: 'ANIMAL' | 'BATCH' | 'BATIMENT' | 'LOT';
    batimentId?: number;
    animalId?: number;
  }) {
    const conditions: any[] = [];

    if (filters?.startDate && filters?.endDate) {
      conditions.push(
        between(feedDistributions.distributionDate, new Date(filters.startDate), new Date(filters.endDate))
      );
    }
    if (filters?.targetType) {
      conditions.push(eq(feedDistributions.targetType, filters.targetType));
    }
    if (filters?.batimentId) {
      conditions.push(eq(feedDistributions.batimentId, filters.batimentId));
    }
    if (filters?.animalId) {
      conditions.push(eq(feedDistributions.animalId, filters.animalId));
    }
    return await db
      .select()
      .from(feedDistributions)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(feedDistributions.distributionDate));
  }

  async getFeedDistributionById(id: number) {
    const [dist] = await db.select().from(feedDistributions).where(eq(feedDistributions.id, id));
    return dist;
  }

  async createFeedDistribution(data: NewFeedDistribution) {
    const [distId] = await db
      .insert(feedDistributions)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const [created] = await db.select().from(feedDistributions).where(eq(feedDistributions.id, distId.id));
    return created;
  }

  async updateFeedDistribution(id: number, data: Partial<NewFeedDistribution>) {
    await db
      .update(feedDistributions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(feedDistributions.id, id));

    const [dist] = await db.select().from(feedDistributions).where(eq(feedDistributions.id, id));
    return dist;
  }

  async deleteFeedDistribution(id: number) {
    const [dist] = await db.select().from(feedDistributions).where(eq(feedDistributions.id, id));
    if (!dist) throw new Error('Distribution non trouvée');
    await db.delete(feedDistributions).where(eq(feedDistributions.id, id));
  }

  // ============================================
  // US-7.5: Feeding Report / Dashboard
  // ============================================

  async getFeedingReport() {
    const [totalItemsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(feedItems);
    const totalFeedItems = totalItemsResult?.count || 0;

    const lowStockItems = await this.getLowStockItems();

    const [totalDistResult] = await db
      .select({ count: sql<number>`COUNT(*)`, totalKg: sql<number>`COALESCE(SUM(quantity_distributed_kg), 0)` })
      .from(feedDistributions);
    const totalDistributions = totalDistResult?.count || 0;
    const totalDistributedKg = Number(totalDistResult?.totalKg) || 0;

    const [totalRationsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(feedRations)
      .where(eq(feedRations.status, 'ACTIVE'));
    const activeRations = totalRationsResult?.count || 0;

    const [totalStockValueResult] = await db
      .select({ value: sql<number>`COALESCE(SUM(current_stock * unit_price), 0)` })
      .from(feedItems);
    const totalStockValue = Number(totalStockValueResult?.value) || 0;

    const recentDistributions = await db
      .select()
      .from(feedDistributions)
      .orderBy(desc(feedDistributions.distributionDate))
      .limit(10);

    return {
      summary: {
        totalFeedItems,
        lowStockCount: lowStockItems.length,
        totalDistributions,
        totalDistributedKg: Math.round(totalDistributedKg * 100) / 100,
        activeRations,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
      },
      lowStockItems,
      recentDistributions,
    };
  }
}
