import { db } from '../db/connection.js';
import {
  feedItems,
  feedStocks,
  feedDistributions,
  NewFeedStock,
} from '../db/schema/index.js';
import {
  eq,
  desc,
  and,
  sql,
  between,
  gte,
  lte,
  isNull,
  isNotNull,
  inArray,
  sum,
  count,
  max,
  min,
  avg,
  asc,
} from 'drizzle-orm';
import { animalWeightRecords } from '../db/schema/animalWeightRecords.js';
import { batiments } from '../db/schema/batiments.js';
import { animals } from '../db/schema/animals.js';

type PurchaseFilters = {
  feedItemId?: number;
  startDate?: string;
  endDate?: string;
  supplier?: string;
  minTotalCost?: string;
  maxTotalCost?: string;
};

type StockByTypeFilters = {
  exploitationId?: number;
  category?: 'FOURRAGE' | 'CONCENTRE' | 'MINERAL' | 'VITAMINE' | 'COMPLEMENT' | 'AUTRE';
  unit?: 'KG' | 'L' | 'TONNE' | 'SAC' | 'UNIT';
  includeEmpty?: boolean;
};

type CriticalStockFilters = {
  exploitationId?: number;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  belowPercentage?: number;
};

type CostAnalysisParams = {
  startDate: string;
  endDate: string;
  groupBy: 'FEEDITEM' | 'CATEGORY' | 'SUPPLIER' | 'MONTH' | 'WEEK';
  feedItemId?: number;
  category?: 'FOURRAGE' | 'CONCENTRE' | 'MINERAL' | 'VITAMINE' | 'COMPLEMENT' | 'AUTRE';
};

type StockoutPredictionParams = {
  exploitationId?: number;
  consumptionWindowDays?: number;
  horizonDays?: number;
  includePurchaseLeadTime?: number;
};

export class FeedingStockMgmtService {
  // ============================================
  // SP-1: Enregistrer / Modifier un achat (approvisionnement)
  // ============================================
  async createPurchase(
    data: Omit<NewFeedStock, 'movementType'> & {
      supplier?: string;
      invoiceReference?: string;
    },
    recordedBy?: number
  ) {
    const [stockId] = await db
      .insert(feedStocks)
      .values({
        feedItemId: data.feedItemId,
        movementType: 'IN',
        quantity: data.quantity,
        unitPriceAtTime: data.unitPriceAtTime,
        movementDate: data.movementDate,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        reference: data.invoiceReference ? data.invoiceReference : data.reference,
        notes: data.supplier
          ? `[FOURNISSEUR: ${data.supplier}] ${data.notes ?? ''}`.trim()
          : data.notes,
        recordedBy: recordedBy ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    const feedItem = await db
      .select()
      .from(feedItems)
      .where(eq(feedItems.id, data.feedItemId))
      .then((rows) => rows[0]);

    if (feedItem) {
      const newStock = (Number(feedItem.currentStock) || 0) + Number(data.quantity);
      await db
        .update(feedItems)
        .set({
          currentStock: String(newStock) as any,
          supplier: data.supplier ?? feedItem.supplier,
          updatedAt: new Date(),
        })
        .where(eq(feedItems.id, data.feedItemId));
    }

    const [created] = await db
      .select({
        id: feedStocks.id,
        feedItemId: feedStocks.feedItemId,
        feedItemName: feedItems.name,
        feedItemCategory: feedItems.category,
        quantity: feedStocks.quantity,
        unitPurchasePrice: feedStocks.unitPriceAtTime,
        purchaseDate: feedStocks.movementDate,
        batchNumber: feedStocks.batchNumber,
        expiryDate: feedStocks.expiryDate,
        reference: feedStocks.reference,
        notes: feedStocks.notes,
      })
      .from(feedStocks)
      .innerJoin(feedItems, eq(feedStocks.feedItemId, feedItems.id))
      .where(eq(feedStocks.id, stockId.id));

    const qtyNum = Number(created?.quantity) || 0;
    const priceNum = Number(created?.unitPurchasePrice) || 0;

    return {
      ...created,
      totalCost: String((qtyNum * priceNum).toFixed(2)),
    };
  }

  async updatePurchase(id: number, data: Partial<PurchaseFilters & { supplier?: string; invoiceReference?: string } & { quantity?: string; unitPriceAtTime?: string; movementDate?: string; batchNumber?: string; expiryDate?: string }>) {
    const existing = await db
      .select()
      .from(feedStocks)
      .where(eq(feedStocks.id, id))
      .then((rows) => rows[0]);

    if (!existing || existing.movementType !== 'IN') {
      throw new Error('Achats non trouvé');
    }

    const updatePayload: Partial<NewFeedStock> = {};
    if (data.quantity !== undefined) (updatePayload as any).quantity = data.quantity;
    if (data.unitPriceAtTime !== undefined) (updatePayload as any).unitPriceAtTime = data.unitPriceAtTime;
    if (data.movementDate !== undefined) (updatePayload as any).movementDate = data.movementDate;
    if (data.batchNumber !== undefined) (updatePayload as any).batchNumber = data.batchNumber;
    if (data.expiryDate !== undefined) (updatePayload as any).expiryDate = data.expiryDate;
    if (data.invoiceReference !== undefined) (updatePayload as any).reference = data.invoiceReference;
    if (Object.keys(updatePayload).length > 0) {
      (updatePayload as any).updatedAt = new Date();
      await db.update(feedStocks).set(updatePayload).where(eq(feedStocks.id, id));
    }

    const [updated] = await db
      .select({
        id: feedStocks.id,
        feedItemId: feedStocks.feedItemId,
        feedItemName: feedItems.name,
        feedItemCategory: feedItems.category,
        quantity: feedStocks.quantity,
        unitPurchasePrice: feedStocks.unitPriceAtTime,
        purchaseDate: feedStocks.movementDate,
        batchNumber: feedStocks.batchNumber,
        expiryDate: feedStocks.expiryDate,
        reference: feedStocks.reference,
        notes: feedStocks.notes,
      })
      .from(feedStocks)
      .innerJoin(feedItems, eq(feedStocks.feedItemId, feedItems.id))
      .where(eq(feedStocks.id, id));

    const qtyNum = Number(updated?.quantity) || 0;
    const priceNum = Number(updated?.unitPurchasePrice) || 0;

    return {
      ...updated,
      totalCost: String((qtyNum * priceNum).toFixed(2)),
    };
  }

  // ============================================
  // SP-2: Stock par type / catégorie (tableau de bord)
  // ============================================
  async getStockByType(filters: StockByTypeFilters) {
    const conditions: any[] = [];
    if (filters.exploitationId) {
      conditions.push(eq(feedItems.exploitationId, filters.exploitationId));
    }
    if (filters.category) {
      conditions.push(eq(feedItems.category, filters.category));
    }
    if (filters.unit) {
      conditions.push(eq(feedItems.unit, filters.unit));
    }
    if (!filters.includeEmpty) {
      conditions.push(sql`${feedItems.currentStock} > 0`);
    }

    const items = await db
      .select({
        id: feedItems.id,
        name: feedItems.name,
        category: feedItems.category,
        unit: feedItems.unit,
        currentStock: feedItems.currentStock,
        minStockThreshold: feedItems.minStockThreshold,
        unitPrice: feedItems.unitPrice,
        supplier: feedItems.supplier,
        updatedAt: feedItems.updatedAt,
      })
      .from(feedItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(feedItems.category), asc(feedItems.name));

    const grouped: Record<string, any[]> = {};
    for (const row of items) {
      const key = row.category ?? 'AUTRE';
      if (!grouped[key]) grouped[key] = [];
      const stockNum = Number(row.currentStock) || 0;
      const priceNum = Number(row.unitPrice) || 0;
      grouped[key].push({
        ...row,
        valueAtCost: String((stockNum * priceNum).toFixed(2)),
        ratioToMin:
          Number(row.minStockThreshold) > 0
            ? Math.round((stockNum / Number(row.minStockThreshold)) * 100)
            : null,
      });
    }

    const summary = Object.entries(grouped).map(([category, rows]) => {
      const totalQty = rows.reduce((s: number, r: any) => s + (Number(r.currentStock) || 0), 0);
      const totalValue = rows.reduce(
        (s: number, r: any) => s + (Number(r.valueAtCost) || 0),
        0
      );
      const lowStockCount = rows.filter((r: any) => r.ratioToMin != null && r.ratioToMin <= 100).length;
      return {
        category,
        itemCount: rows.length,
        totalQuantity: String(totalQty.toFixed(3)),
        totalValueAtCost: String(totalValue.toFixed(2)),
        lowStockCount,
        items: rows,
      };
    });

    return summary;
  }

  // ============================================
  // SP-3: Historique des achats
  // ============================================
  async getPurchaseHistory(filters: PurchaseFilters) {
    const conditions: any[] = [eq(feedStocks.movementType, 'IN')];
    if (filters.feedItemId) {
      conditions.push(eq(feedStocks.feedItemId, filters.feedItemId));
    }
    if (filters.startDate && filters.endDate) {
      conditions.push(
        between(feedStocks.movementDate, new Date(filters.startDate), new Date(filters.endDate))
      );
    } else if (filters.startDate) {
      conditions.push(gte(feedStocks.movementDate, new Date(filters.startDate)));
    } else if (filters.endDate) {
      conditions.push(lte(feedStocks.movementDate, new Date(filters.endDate)));
    }

    const rows = await db
      .select({
        id: feedStocks.id,
        feedItemId: feedStocks.feedItemId,
        feedItemName: feedItems.name,
        category: feedItems.category,
        quantity: feedStocks.quantity,
        unitPurchasePrice: feedStocks.unitPriceAtTime,
        purchaseDate: feedStocks.movementDate,
        batchNumber: feedStocks.batchNumber,
        expiryDate: feedStocks.expiryDate,
        invoiceReference: feedStocks.reference,
        notes: feedStocks.notes,
      })
      .from(feedStocks)
      .innerJoin(feedItems, eq(feedStocks.feedItemId, feedItems.id))
      .where(and(...conditions))
      .orderBy(desc(feedStocks.movementDate));

    let filtered = rows as any[];
    if (filters.supplier) {
      const lower = filters.supplier.toLowerCase();
      filtered = filtered.filter((r) => r.notes?.toLowerCase().includes(lower));
    }

    const enriched = filtered.map((r) => {
      const qtyNum = Number(r.quantity) || 0;
      const priceNum = Number(r.unitPurchasePrice) || 0;
      return {
        ...r,
        totalCost: String((qtyNum * priceNum).toFixed(2)),
      };
    });

    const totalCount = enriched.length;
    const totalQuantity = enriched.reduce((s, r) => s + Number(r.quantity), 0);
    const totalCost = enriched.reduce((s, r) => s + Number(r.totalCost), 0);
    const avgUnitCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    return {
      totalCount,
      totalQuantity: String(totalQuantity.toFixed(3)),
      totalCost: String(totalCost.toFixed(2)),
      averageUnitCost: String(avgUnitCost.toFixed(2)),
      records: enriched,
    };
  }

  // ============================================
  // SP-4: Alertes de péremption (lots expirant prochainement)
  // ============================================
  async getExpiryAlerts(params: { daysWindow?: number; exploitationId?: number; onlyWithStock?: boolean }) {
    const windowDays = params.daysWindow ?? 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limitDate = new Date(today);
    limitDate.setDate(today.getDate() + windowDays);

    const conditions: any[] = [
      eq(feedStocks.movementType, 'IN'),
      isNotNull(feedStocks.expiryDate),
      lte(feedStocks.expiryDate, limitDate),
    ];

    if (params.exploitationId) {
      conditions.push(eq(feedItems.exploitationId, params.exploitationId));
    }

    const results = await db
      .select({
        id: feedStocks.id,
        feedItemId: feedStocks.feedItemId,
        feedItemName: feedItems.name,
        category: feedItems.category,
        batchNumber: feedStocks.batchNumber,
        quantity: feedStocks.quantity,
        unit: feedItems.unit,
        expiryDate: feedStocks.expiryDate,
        unitPrice: feedStocks.unitPriceAtTime,
        currentStockItem: feedItems.currentStock,
      })
      .from(feedStocks)
      .innerJoin(feedItems, eq(feedStocks.feedItemId, feedItems.id))
      .where(and(...conditions))
      .orderBy(asc(feedStocks.expiryDate));

    const alerts = results
      .filter((r) => {
        if (params.onlyWithStock === false) return true;
        return Number(r.quantity) > 0;
      })
      .map((r) => {
        const expiry = r.expiryDate ? new Date(r.expiryDate as any) : null;
        const daysLeft = expiry ? Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
        let status: 'EXPIRED' | 'CRITICAL' | 'WARNING' | 'SOON' = 'SOON';
        if (daysLeft != null) {
          if (daysLeft < 0) status = 'EXPIRED';
          else if (daysLeft <= 7) status = 'CRITICAL';
          else if (daysLeft <= 15) status = 'WARNING';
          else status = 'SOON';
        }
        const qtyNum = Number(r.quantity) || 0;
        const priceNum = Number(r.unitPrice) || 0;
        return {
          ...r,
          daysLeft,
          status,
          atRiskValue: String((qtyNum * priceNum).toFixed(2)),
        };
      });

    const summary = {
      total: alerts.length,
      expired: alerts.filter((a) => a.status === 'EXPIRED').length,
      critical: alerts.filter((a) => a.status === 'CRITICAL').length,
      warning: alerts.filter((a) => a.status === 'WARNING').length,
      soon: alerts.filter((a) => a.status === 'SOON').length,
      totalAtRiskValue: String(alerts.reduce((s, a) => s + Number(a.atRiskValue), 0).toFixed(2)),
    };

    return {
      summary,
      alerts,
    };
  }

  // ============================================
  // SP-5: Définir / Mettre à jour les seuils minimaux
  // ============================================
  async updateStockThreshold(data: {
    feedItemId: number;
    minStockThreshold: string;
    safetyStockDays?: number;
    reorderPoint?: string;
  }) {
    const existing = await db
      .select()
      .from(feedItems)
      .where(eq(feedItems.id, data.feedItemId))
      .then((rows) => rows[0]);

    if (!existing) {
      throw new Error('Article non trouvé');
    }

    const notesParts: string[] = [];
    if (data.safetyStockDays != null) {
      notesParts.push(`SAFETY_STOCK_DAYS:${data.safetyStockDays}`);
    }
    if (data.reorderPoint != null) {
      notesParts.push(`REORDER_POINT:${data.reorderPoint}`);
    }

    const previousNotes = (existing.description ?? '').replace(/\[(META:[^\]]*)\]/g, '').trim();
    const metaBlock = notesParts.length > 0 ? `[META:${notesParts.join(';')}]` : '';
    const newDescription = [metaBlock, previousNotes].filter(Boolean).join(' ').trim();

    await db
      .update(feedItems)
      .set({
        minStockThreshold: data.minStockThreshold as any,
        description: newDescription || undefined,
        updatedAt: new Date(),
      })
      .where(eq(feedItems.id, data.feedItemId));

    const [updated] = await db
      .select({
        id: feedItems.id,
        name: feedItems.name,
        category: feedItems.category,
        unit: feedItems.unit,
        currentStock: feedItems.currentStock,
        minStockThreshold: feedItems.minStockThreshold,
        description: feedItems.description,
      })
      .from(feedItems)
      .where(eq(feedItems.id, data.feedItemId));

    return {
      ...updated,
      safetyStockDays: data.safetyStockDays ?? null,
      reorderPoint: data.reorderPoint ?? null,
    };
  }

  // ============================================
  // SP-6: Alertes stock critique (sous seuil)
  // ============================================
  async getCriticalStockAlerts(filters: CriticalStockFilters) {
    const conditions: any[] = [
      sql`${feedItems.currentStock} <= ${feedItems.minStockThreshold}`,
    ];
    if (filters.exploitationId) {
      conditions.push(eq(feedItems.exploitationId, filters.exploitationId));
    }

    const rows = await db
      .select({
        id: feedItems.id,
        name: feedItems.name,
        category: feedItems.category,
        unit: feedItems.unit,
        currentStock: feedItems.currentStock,
        minStockThreshold: feedItems.minStockThreshold,
        unitPrice: feedItems.unitPrice,
        supplier: feedItems.supplier,
      })
      .from(feedItems)
      .where(and(...conditions))
      .orderBy(asc(feedItems.currentStock));

    const alerts = rows.map((r) => {
      const stockNum = Number(r.currentStock) || 0;
      const minNum = Number(r.minStockThreshold) || 0;
      const gap = Math.max(0, minNum - stockNum);
      const ratio = minNum > 0 ? (stockNum / minNum) * 100 : 100;
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (stockNum === 0) severity = 'CRITICAL';
      else if (ratio <= 25) severity = 'CRITICAL';
      else if (ratio <= 50) severity = 'HIGH';
      else if (ratio <= 75) severity = 'MEDIUM';
      else severity = 'LOW';
      const priceNum = Number(r.unitPrice) || 0;
      return {
        ...r,
        gapToMin: String(gap.toFixed(3)),
        percentageOfMin: Math.round(ratio),
        severity,
        estimatedReorderCost: String((gap * priceNum).toFixed(2)),
      };
    });

    let filtered = alerts;
    const severityFilter = filters.severity;
    if (severityFilter) {
      filtered = filtered.filter((a) => a.severity === severityFilter);
    }
    const belowPct = filters.belowPercentage;
    if (belowPct != null) {
      filtered = filtered.filter((a) => a.percentageOfMin <= belowPct);
    }

    const summary = {
      total: filtered.length,
      critical: filtered.filter((a) => a.severity === 'CRITICAL').length,
      high: filtered.filter((a) => a.severity === 'HIGH').length,
      medium: filtered.filter((a) => a.severity === 'MEDIUM').length,
      low: filtered.filter((a) => a.severity === 'LOW').length,
      totalValueGap: String(filtered.reduce((s, a) => s + Number(a.estimatedReorderCost), 0).toFixed(2)),
    };

    return {
      summary,
      alerts: filtered,
    };
  }

  // ============================================
  // SP-7: Analyse coûts d'approvisionnement
  // ============================================
  async getPurchaseCostAnalysis(params: CostAnalysisParams) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    const conditions: any[] = [
      eq(feedStocks.movementType, 'IN'),
      between(feedStocks.movementDate, start, end),
    ];
    if (params.feedItemId) {
      conditions.push(eq(feedStocks.feedItemId, params.feedItemId));
    }
    if (params.category) {
      conditions.push(eq(feedItems.category, params.category));
    }

    const allRows = await db
      .select({
        id: feedStocks.id,
        feedItemId: feedStocks.feedItemId,
        feedItemName: feedItems.name,
        category: feedItems.category,
        supplier: feedItems.supplier,
        quantity: feedStocks.quantity,
        unitPrice: feedStocks.unitPriceAtTime,
        purchaseDate: feedStocks.movementDate,
      })
      .from(feedStocks)
      .innerJoin(feedItems, eq(feedStocks.feedItemId, feedItems.id))
      .where(and(...conditions))
      .orderBy(asc(feedStocks.movementDate));

    const enriched = allRows.map((r) => {
      const qty = Number(r.quantity) || 0;
      const price = Number(r.unitPrice) || 0;
      const date = new Date(r.purchaseDate as any);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const weekNum = Math.ceil(
        ((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7))
      );
      const weekKey = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      return {
        ...r,
        totalCost: qty * price,
        monthKey,
        weekKey,
      };
    });

    let groupKeyFn: (r: any) => string;
    switch (params.groupBy) {
      case 'FEEDITEM':
        groupKeyFn = (r) => `${r.feedItemId}|${r.feedItemName}`;
        break;
      case 'CATEGORY':
        groupKeyFn = (r) => r.category ?? 'AUTRE';
        break;
      case 'SUPPLIER':
        groupKeyFn = (r) => r.supplier ?? 'INCONNU';
        break;
      case 'WEEK':
        groupKeyFn = (r) => r.weekKey;
        break;
      case 'MONTH':
      default:
        groupKeyFn = (r) => r.monthKey;
    }

    const groupsMap = new Map<string, any>();
    for (const r of enriched) {
      const key = groupKeyFn(r);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          groupKey: key,
          purchaseCount: 0,
          totalQuantity: 0,
          totalCost: 0,
          minUnitPrice: Infinity,
          maxUnitPrice: -Infinity,
          sumUnitPrice: 0,
          sumDivisor: 0,
        });
      }
      const g = groupsMap.get(key)!;
      g.purchaseCount += 1;
      g.totalQuantity += Number(r.quantity) || 0;
      g.totalCost += r.totalCost;
      const price = Number(r.unitPrice);
      if (!isNaN(price)) {
        g.minUnitPrice = Math.min(g.minUnitPrice, price);
        g.maxUnitPrice = Math.max(g.maxUnitPrice, price);
        g.sumUnitPrice += price;
        g.sumDivisor += 1;
      }
    }

    const groups = Array.from(groupsMap.values()).map((g) => ({
      groupKey: g.groupKey,
      purchaseCount: g.purchaseCount,
      totalQuantity: String(g.totalQuantity.toFixed(3)),
      totalCost: String(g.totalCost.toFixed(2)),
      avgUnitPrice: String(
        g.sumDivisor > 0 ? (g.sumUnitPrice / g.sumDivisor).toFixed(2) : '0.00'
      ),
      minUnitPrice: String(
        isFinite(g.minUnitPrice) ? g.minUnitPrice.toFixed(2) : '0.00'
      ),
      maxUnitPrice: String(
        isFinite(g.maxUnitPrice) ? g.maxUnitPrice.toFixed(2) : '0.00'
      ),
    }));

    const totalOverallCost = enriched.reduce((s, r) => s + r.totalCost, 0);
    const totalOverallQty = enriched.reduce((s, r) => s + (Number(r.quantity) || 0), 0);

    return {
      period: { startDate: params.startDate, endDate: params.endDate },
      groupBy: params.groupBy,
      overview: {
        totalPurchaseCount: enriched.length,
        totalQuantityPurchased: String(totalOverallQty.toFixed(3)),
        totalCost: String(totalOverallCost.toFixed(2)),
        averageUnitCost: String(
          totalOverallQty > 0 ? (totalOverallCost / totalOverallQty).toFixed(2) : '0.00'
        ),
      },
      groups,
      transactions: enriched.map((r) => ({
        ...r,
        totalCost: String(r.totalCost.toFixed(2)),
      })),
    };
  }

  // ============================================
  // SP-8: Prédiction de rupture de stock
  // ============================================
  async getStockoutPredictions(params: StockoutPredictionParams) {
    const windowDays = params.consumptionWindowDays ?? 30;
    const horizonDays = params.horizonDays ?? 90;
    const leadTimeDays = params.includePurchaseLeadTime ?? 7;

    const today = new Date();
    const windowStart = new Date(today);
    windowStart.setDate(today.getDate() - windowDays);

    const distributions = await db
      .select({
        rationId: feedDistributions.rationId,
        distributionDate: feedDistributions.distributionDate,
        quantityDistributedKg: feedDistributions.quantityDistributedKg,
        numberOfAnimals: feedDistributions.numberOfAnimals,
      })
      .from(feedDistributions)
      .where(gte(feedDistributions.distributionDate, windowStart));

    const rationComposition = await db
      .select({
        rationId: feedItems.id,
      })
      .from(feedItems);

    const allItems = await db
      .select({
        id: feedItems.id,
        name: feedItems.name,
        category: feedItems.category,
        unit: feedItems.unit,
        currentStock: feedItems.currentStock,
        minStockThreshold: feedItems.minStockThreshold,
        unitPrice: feedItems.unitPrice,
        exploitationId: feedItems.exploitationId,
      })
      .from(feedItems)
      .orderBy(asc(feedItems.name));

    const items =
      params.exploitationId != null
        ? allItems.filter((i) => i.exploitationId === params.exploitationId)
        : allItems;

    const totalDistributedKg = distributions.reduce(
      (s, d) => s + (Number(d.quantityDistributedKg) || 0),
      0
    );
    const avgDailyAllKg = windowDays > 0 ? totalDistributedKg / windowDays : 0;

    const itemsWithValue = items.map((it) => {
      const stockNum = Number(it.currentStock) || 0;
      const minNum = Number(it.minStockThreshold) || 0;
      const dailyConsumption =
        totalDistributedKg > 0 ? avgDailyAllKg * (stockNum / Math.max(1, stockNum)) : avgDailyAllKg;
      const assumedDaily = Math.max(0.001, dailyConsumption / Math.max(1, items.length));
      const daysLeft = assumedDaily > 0 ? stockNum / assumedDaily : Infinity;
      const stockoutDate = isFinite(daysLeft)
        ? new Date(today.getTime() + daysLeft * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : null;
      const reorderDate =
        stockoutDate != null
          ? new Date(
              new Date(stockoutDate).getTime() - leadTimeDays * 24 * 60 * 60 * 1000
            ).toISOString().slice(0, 10)
          : null;
      const horizonLimit = new Date(today);
      horizonLimit.setDate(today.getDate() + horizonDays);
      const willStockout = stockoutDate != null && new Date(stockoutDate) <= horizonLimit;
      const daysUntilStockout = isFinite(daysLeft) ? Math.round(daysLeft) : null;
      const willReorderInHorizon =
        reorderDate != null && new Date(reorderDate) <= horizonLimit;

      let riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE';
      if (stockNum === 0) riskLevel = 'CRITICAL';
      else if (willStockout && daysUntilStockout != null && daysUntilStockout <= leadTimeDays)
        riskLevel = 'CRITICAL';
      else if (willStockout && daysUntilStockout != null && daysUntilStockout <= 14)
        riskLevel = 'HIGH';
      else if (willStockout) riskLevel = 'MEDIUM';
      else if (stockNum <= minNum) riskLevel = 'LOW';

      const horizonQtyNeeded = assumedDaily * horizonDays;
      const shortfallQty = Math.max(0, horizonQtyNeeded - stockNum);
      const priceNum = Number(it.unitPrice) || 0;

      return {
        ...it,
        assumedDailyConsumption: String(assumedDaily.toFixed(3)),
        daysUntilStockout,
        stockoutDate,
        reorderDate,
        reorderLeadTimeDays: leadTimeDays,
        willStockoutInHorizon: willStockout,
        willReorderInHorizon,
        riskLevel,
        horizonQuantityNeeded: String(horizonQtyNeeded.toFixed(3)),
        projectedShortfallQty: String(shortfallQty.toFixed(3)),
        projectedShortfallCost: String((shortfallQty * priceNum).toFixed(2)),
      };
    });

    const summary = {
      windowDays,
      horizonDays,
      leadTimeDays,
      totalItems: itemsWithValue.length,
      criticalRisk: itemsWithValue.filter((i) => i.riskLevel === 'CRITICAL').length,
      highRisk: itemsWithValue.filter((i) => i.riskLevel === 'HIGH').length,
      mediumRisk: itemsWithValue.filter((i) => i.riskLevel === 'MEDIUM').length,
      lowRisk: itemsWithValue.filter((i) => i.riskLevel === 'LOW').length,
      noRisk: itemsWithValue.filter((i) => i.riskLevel === 'NONE').length,
      totalProjectedShortfallCost: String(
        itemsWithValue.reduce((s, i) => s + Number(i.projectedShortfallCost), 0).toFixed(2)
      ),
      totalDistributedWindowKg: String(totalDistributedKg.toFixed(3)),
      avgDailyDistributedKg: String(avgDailyAllKg.toFixed(3)),
    };

    return {
      summary,
      predictions: itemsWithValue,
    };
  }

  // ============================================
  // US-7.4: FCR et efficacité alimentaire
  // ============================================
  async getFCR(params: {
    startDate: string;
    endDate: string;
    groupBy: 'ANIMAL' | 'BATCH' | 'BATIMENT' | 'GLOBAL';
    targetType?: 'ANIMAL' | 'BATCH' | 'BATIMENT' | 'LOT';
    batimentId?: number;
    animalId?: number;
  }) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const conditions: any[] = [between(feedDistributions.distributionDate, start, end)];

    if (params.targetType) {
      conditions.push(eq(feedDistributions.targetType, params.targetType));
    }
    if (params.batimentId) {
      conditions.push(eq(feedDistributions.batimentId, params.batimentId));
    }
    if (params.animalId) {
      conditions.push(eq(feedDistributions.animalId, params.animalId));
    }

    const distributions = await db
      .select({
        id: feedDistributions.id,
        targetType: feedDistributions.targetType,
        animalId: feedDistributions.animalId,
        batimentId: feedDistributions.batimentId,
        batchName: feedDistributions.batchName,
        quantityDistributedKg: feedDistributions.quantityDistributedKg,
        refusedQuantityKg: feedDistributions.refusedQuantityKg,
        numberOfAnimals: feedDistributions.numberOfAnimals,
        distributionDate: feedDistributions.distributionDate,
      })
      .from(feedDistributions)
      .where(and(...conditions));

    const animalIds = Array.from(
      new Set(distributions.map((d) => d.animalId).filter((id): id is number => id != null))
    );

    let weightRecords: { animalId: number; weight: number; date: string }[] = [];
    if (animalIds.length > 0) {
      weightRecords = await db
        .select({
          animalId: animalWeightRecords.animalId,
          weight: animalWeightRecords.weight,
          date: animalWeightRecords.date,
        })
        .from(animalWeightRecords)
        .where(
          and(
            inArray(animalWeightRecords.animalId, animalIds),
            between(animalWeightRecords.date, start, end)
          )
        );
    }

    const animalWeightMap2 = new Map<number, { startWeight: number; endWeight: number; startDate: Date; endDate: Date }>();
    for (const rec of weightRecords) {
      const w = Number(rec.weight) || 0;
      const d = new Date(rec.date);
      const existing = animalWeightMap2.get(rec.animalId);
      if (!existing) {
        animalWeightMap2.set(rec.animalId, { startWeight: w, endWeight: w, startDate: d, endDate: d });
      } else {
        if (d < existing.startDate) {
          existing.startDate = d;
          existing.startWeight = w;
        }
        if (d > existing.endDate) {
          existing.endDate = d;
          existing.endWeight = w;
        }
      }
    }

    const netConsumptionByAnimal = new Map<number, number>();
    for (const d of distributions) {
      if (d.animalId == null) continue;
      const net = (Number(d.quantityDistributedKg) || 0) - (Number(d.refusedQuantityKg) || 0);
      netConsumptionByAnimal.set(d.animalId, (netConsumptionByAnimal.get(d.animalId) || 0) + net);
    }

    const buildKey = (d: any): string => {
      if (params.groupBy === 'ANIMAL') return `animal_${d.animalId ?? 'none'}`;
      if (params.groupBy === 'BATCH') return `batch_${d.batchName ?? 'none'}`;
      if (params.groupBy === 'BATIMENT') return `batiment_${d.batimentId ?? 'none'}`;
      return 'global';
    };

    const getLabel = (key: string, d: any): string => {
      if (params.groupBy === 'ANIMAL') {
        const id = d.animalId;
        return id != null ? `Animal #${id}` : 'Sans animal';
      }
      if (params.groupBy === 'BATCH') return d.batchName || 'Sans lot';
      if (params.groupBy === 'BATIMENT') {
        const id = d.batimentId;
        return id != null ? `Batiment #${id}` : 'Sans batiment';
      }
      return 'Global';
    };

    const grouped = new Map<string, { key: string; label: string; consumption: number; animalIds: number[] }>();
    for (const d of distributions) {
      const key = buildKey(d);
      const existing = grouped.get(key);
      const net = (Number(d.quantityDistributedKg) || 0) - (Number(d.refusedQuantityKg) || 0);
      if (!existing) {
        grouped.set(key, {
          key,
          label: getLabel(key, d),
          consumption: net,
          animalIds: d.animalId != null ? [d.animalId] : [],
        });
      } else {
        existing.consumption += net;
        if (d.animalId != null && !existing.animalIds.includes(d.animalId)) {
          existing.animalIds.push(d.animalId);
        }
      }
    }

    const results = Array.from(grouped.values()).map((g) => {
      let weightGain = 0;
      if (params.groupBy === 'ANIMAL' && g.animalIds.length === 1) {
        const w = animalWeightMap2.get(g.animalIds[0]);
        if (w) weightGain = Math.max(0, w.endWeight - w.startWeight);
      } else if (g.animalIds.length > 0) {
        let totalGain = 0;
        let count = 0;
        for (const aid of g.animalIds) {
          const w = animalWeightMap2.get(aid);
          if (w) {
            totalGain += Math.max(0, w.endWeight - w.startWeight);
            count++;
          }
        }
        weightGain = count > 0 ? totalGain / count : 0;
      }

      const fcr = weightGain > 0 ? g.consumption / weightGain : null;
      return {
        groupKey: g.key,
        label: g.label,
        totalConsumptionKg: Math.round(g.consumption * 1000) / 1000,
        weightGainKg: Math.round(weightGain * 1000) / 1000,
        fcr: fcr != null ? Math.round(fcr * 100) / 100 : null,
        animalCount: g.animalIds.length,
      };
    });

    const validFCRs = results.filter((r) => r.fcr != null).map((r) => r.fcr as number);
    const avgFCR = validFCRs.length > 0 ? validFCRs.reduce((s, v) => s + v, 0) / validFCRs.length : null;

    const summary = {
      period: { startDate: params.startDate, endDate: params.endDate },
      groupBy: params.groupBy,
      totalGroups: results.length,
      groupsWithFCR: validFCRs.length,
      averageFCR: avgFCR != null ? Math.round(avgFCR * 100) / 100 : null,
      objectiveFCR: 5.0,
      totalConsumptionKg: Math.round(results.reduce((s, r) => s + r.totalConsumptionKg, 0) * 1000) / 1000,
      totalWeightGainKg: Math.round(results.reduce((s, r) => s + r.weightGainKg, 0) * 1000) / 1000,
    };

    return {
      summary,
      groups: results,
    };
  }

  async getFoodCostPerAnimal(params: {
    startDate: string;
    endDate: string;
    groupBy: 'ANIMAL' | 'BATCH' | 'BATIMENT' | 'MONTH';
  }) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const conditions: any[] = [
      between(feedDistributions.distributionDate, start, end),
    ];

    const distributions = await db
      .select({
        id: feedDistributions.id,
        targetType: feedDistributions.targetType,
        animalId: feedDistributions.animalId,
        batimentId: feedDistributions.batimentId,
        batchName: feedDistributions.batchName,
        quantityDistributedKg: feedDistributions.quantityDistributedKg,
        refusedQuantityKg: feedDistributions.refusedQuantityKg,
        numberOfAnimals: feedDistributions.numberOfAnimals,
        distributionDate: feedDistributions.distributionDate,
        rationId: feedDistributions.rationId,
        costPerKg: feedRations.costPerKg,
      })
      .from(feedDistributions)
      .leftJoin(feedRations, eq(feedDistributions.rationId, feedRations.id))
      .where(and(...conditions));

    const animalIds = Array.from(
      new Set(distributions.map((d) => d.animalId).filter((id): id is number => id != null))
    );

    let weightRecords: { animalId: number; weight: number; date: string }[] = [];
    if (animalIds.length > 0) {
      weightRecords = await db
        .select({
          animalId: animalWeightRecords.animalId,
          weight: animalWeightRecords.weight,
          date: animalWeightRecords.date,
        })
        .from(animalWeightRecords)
        .where(
          and(
            inArray(animalWeightRecords.animalId, animalIds),
            between(animalWeightRecords.date, start, end)
          )
        );
    }

    const animalWeightMap = new Map<number, { startWeight: number; endWeight: number; startDate: Date; endDate: Date }>();
    for (const rec of weightRecords) {
      const w = Number(rec.weight) || 0;
      const d = new Date(rec.date);
      const existing = animalWeightMap.get(rec.animalId);
      if (!existing) {
        animalWeightMap.set(rec.animalId, { startWeight: w, endWeight: w, startDate: d, endDate: d });
      } else {
        if (d < existing.startDate) {
          existing.startDate = d;
          existing.startWeight = w;
        }
        if (d > existing.endDate) {
          existing.endDate = d;
          existing.endWeight = w;
        }
      }
    }

    const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const buildKey = (d: any): string => {
      if (params.groupBy === 'ANIMAL') return `animal_${d.animalId ?? 'none'}`;
      if (params.groupBy === 'BATCH') return `batch_${d.batchName ?? 'none'}`;
      if (params.groupBy === 'BATIMENT') return `batiment_${d.batimentId ?? 'none'}`;
      const date = new Date(d.distributionDate as any);
      return `month_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    const getLabel = (key: string, d: any): string => {
      if (params.groupBy === 'ANIMAL') {
        const id = d.animalId;
        return id != null ? `Animal #${id}` : 'Sans animal';
      }
      if (params.groupBy === 'BATCH') return d.batchName || 'Sans lot';
      if (params.groupBy === 'BATIMENT') {
        const id = d.batimentId;
        return id != null ? `Batiment #${id}` : 'Sans batiment';
      }
      const date = new Date(d.distributionDate as any);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    const grouped = new Map<string, {
      key: string;
      label: string;
      totalCost: number;
      animalIds: number[];
      numberOfAnimals: number;
      distributionCount: number;
    }>();

    for (const d of distributions) {
      const key = buildKey(d);
      const existing = grouped.get(key);
      const netQty = (Number(d.quantityDistributedKg) || 0) - (Number(d.refusedQuantityKg) || 0);
      const costPerKg = Number(d.costPerKg) || 0;
      const cost = netQty * costPerKg;
      const animals = d.numberOfAnimals && d.numberOfAnimals > 0 ? d.numberOfAnimals : (d.animalId ? 1 : 0);

      if (!existing) {
        grouped.set(key, {
          key,
          label: getLabel(key, d),
          totalCost: cost,
          animalIds: d.animalId != null ? [d.animalId] : [],
          numberOfAnimals: animals,
          distributionCount: 1,
        });
      } else {
        existing.totalCost += cost;
        existing.distributionCount += 1;
        existing.numberOfAnimals = Math.max(existing.numberOfAnimals, animals);
        if (d.animalId != null && !existing.animalIds.includes(d.animalId)) {
          existing.animalIds.push(d.animalId);
        }
      }
    }

    const results = Array.from(grouped.values()).map((g) => {
      let weightGain = 0;
      if (g.animalIds.length === 1) {
        const w = animalWeightMap.get(g.animalIds[0]);
        if (w) weightGain = Math.max(0, w.endWeight - w.startWeight);
      } else if (g.animalIds.length > 0) {
        let totalGain = 0;
        let count = 0;
        for (const aid of g.animalIds) {
          const w = animalWeightMap.get(aid);
          if (w) {
            totalGain += Math.max(0, w.endWeight - w.startWeight);
            count++;
          }
        }
        weightGain = count > 0 ? totalGain / count : 0;
      }

      const dailyCostPerAnimal = g.numberOfAnimals > 0 ? g.totalCost / daysInPeriod / g.numberOfAnimals : 0;
      const costPerKgGain = weightGain > 0 ? g.totalCost / weightGain : null;

      return {
        groupKey: g.key,
        label: g.label,
        totalCost: Math.round(g.totalCost * 100) / 100,
        distributionCount: g.distributionCount,
        numberOfAnimals: g.numberOfAnimals,
        dailyCostPerAnimal: Math.round(dailyCostPerAnimal * 100) / 100,
        weightGainKg: Math.round(weightGain * 1000) / 1000,
        costPerKgGain: costPerKgGain != null ? Math.round(costPerKgGain * 100) / 100 : null,
      };
    });

    const totalCostAll = results.reduce((s, r) => s + r.totalCost, 0);
    const totalAnimals = results.reduce((s, r) => s + r.numberOfAnimals, 0);
    const avgDailyCostPerAnimal = totalAnimals > 0 ? totalCostAll / daysInPeriod / totalAnimals : 0;
    const totalWeightGain = results.reduce((s, r) => s + r.weightGainKg, 0);
    const avgCostPerKgGain = totalWeightGain > 0 ? totalCostAll / totalWeightGain : null;

    const summary = {
      period: { startDate: params.startDate, endDate: params.endDate },
      groupBy: params.groupBy,
      daysInPeriod,
      totalGroups: results.length,
      totalCost: Math.round(totalCostAll * 100) / 100,
      totalAnimals,
      averageDailyCostPerAnimal: Math.round(avgDailyCostPerAnimal * 100) / 100,
      totalWeightGainKg: Math.round(totalWeightGain * 1000) / 1000,
      averageCostPerKgGain: avgCostPerKgGain != null ? Math.round(avgCostPerKgGain * 100) / 100 : null,
    };

    return {
      summary,
      groups: results,
    };
  }
}
