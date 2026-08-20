import { Context } from 'hono';
import { FeedingStockMgmtService } from '../services/feedingStockMgmt.service.js';
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  stockByTypeFilterSchema,
  purchaseHistoryFilterSchema,
  expiryAlertSchema,
  updateThresholdSchema,
  criticalStockAlertSchema,
  purchaseCostAnalysisSchema,
  stockoutPredictionSchema,
  fcrAnalysisSchema,
} from '../validators/feedingStockMgmt.validator.js';

const stockMgmtService = new FeedingStockMgmtService();

export const FeedingStockMgmtController = {
  // ============================================
  // SP-1: Enregistrer un achat (approvisionnement)
  // ============================================
  async createPurchase(c: Context) {
    const user = c.get('user') as { id: number } | undefined;
    const body = await c.req.json();
    try {
      const validated = createPurchaseSchema.parse(body);
      const result = await stockMgmtService.createPurchase(
        {
          feedItemId: validated.feedItemId,
          quantity: validated.quantity,
          unitPriceAtTime: validated.unitPurchasePrice,
          movementDate: validated.purchaseDate,
          batchNumber: validated.batchNumber,
          expiryDate: validated.expiryDate,
          reference: validated.invoiceReference,
          notes: validated.notes,
          recordedBy: user?.id ?? null,
        } as any,
        user?.id
      );
      (result as any).supplier = validated.supplier ?? null;
      return c.json({ success: true, data: result }, 201);
    } catch (error: any) {
      console.error('Erreur création achat:', error);
      return c.json(
        { success: false, message: 'Données invalides', errors: error.errors || error.message },
        400
      );
    }
  },

  async updatePurchase(c: Context) {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      const validated = updatePurchaseSchema.parse(body);
      const payload: any = { ...validated };
      if (validated.unitPurchasePrice) payload.unitPriceAtTime = validated.unitPurchasePrice;
      if (validated.purchaseDate) payload.movementDate = validated.purchaseDate;
      const updated = await stockMgmtService.updatePurchase(id, payload);
      if (!updated) {
        return c.json({ success: false, message: 'Achat non trouvé' }, 404);
      }
      return c.json({ success: true, data: updated });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Données invalides', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // SP-2: Stock par type / catégorie
  // ============================================
  async getStockByType(c: Context) {
    try {
      const query = {
        exploitationId: c.req.query('exploitationId'),
        category: c.req.query('category') as any,
        unit: c.req.query('unit') as any,
        includeEmpty: c.req.query('includeEmpty'),
      };
      const validated = stockByTypeFilterSchema.parse(query);
      const data = await stockMgmtService.getStockByType({
        exploitationId: validated.exploitationId,
        category: validated.category,
        unit: validated.unit,
        includeEmpty: validated.includeEmpty,
      });
      return c.json({ success: true, data });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Requête invalide', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // SP-3: Historique des achats
  // ============================================
  async getPurchaseHistory(c: Context) {
    try {
      const query = {
        feedItemId: c.req.query('feedItemId'),
        startDate: c.req.query('startDate'),
        endDate: c.req.query('endDate'),
        supplier: c.req.query('supplier'),
        minTotalCost: c.req.query('minTotalCost'),
        maxTotalCost: c.req.query('maxTotalCost'),
      };
      const validated = purchaseHistoryFilterSchema.parse(query);
      const data = await stockMgmtService.getPurchaseHistory({
        feedItemId: validated.feedItemId,
        startDate: validated.startDate,
        endDate: validated.endDate,
        supplier: validated.supplier,
        minTotalCost: validated.minTotalCost,
        maxTotalCost: validated.maxTotalCost,
      });
      return c.json({ success: true, data });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Requête invalide', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // SP-4: Alertes péremption
  // ============================================
  async getExpiryAlerts(c: Context) {
    try {
      const query = {
        daysWindow: c.req.query('daysWindow'),
        exploitationId: c.req.query('exploitationId'),
        onlyWithStock: c.req.query('onlyWithStock'),
      };
      const validated = expiryAlertSchema.parse(query);
      const data = await stockMgmtService.getExpiryAlerts({
        daysWindow: validated.daysWindow,
        exploitationId: validated.exploitationId,
        onlyWithStock: validated.onlyWithStock,
      });
      return c.json({ success: true, data });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Requête invalide', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // SP-5: Mettre à jour seuils minimaux
  // ============================================
  async updateStockThreshold(c: Context) {
    const body = await c.req.json();
    try {
      const validated = updateThresholdSchema.parse(body);
      const result = await stockMgmtService.updateStockThreshold({
        feedItemId: validated.feedItemId,
        minStockThreshold: validated.minStockThreshold,
        safetyStockDays: validated.safetyStockDays,
        reorderPoint: validated.reorderPoint,
      });
      return c.json({ success: true, data: result });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Données invalides', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // SP-6: Alertes stock critique
  // ============================================
  async getCriticalStockAlerts(c: Context) {
    try {
      const query = {
        exploitationId: c.req.query('exploitationId'),
        severity: c.req.query('severity') as any,
        belowPercentage: c.req.query('belowPercentage'),
      };
      const validated = criticalStockAlertSchema.parse(query);
      const data = await stockMgmtService.getCriticalStockAlerts({
        exploitationId: validated.exploitationId,
        severity: validated.severity,
        belowPercentage: validated.belowPercentage,
      });
      return c.json({ success: true, data });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Requête invalide', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // SP-7: Analyse coûts approvisionnement
  // ============================================
  async getPurchaseCostAnalysis(c: Context) {
    try {
      const query = {
        startDate: c.req.query('startDate'),
        endDate: c.req.query('endDate'),
        groupBy: c.req.query('groupBy') as any,
        feedItemId: c.req.query('feedItemId'),
        category: c.req.query('category') as any,
      };
      const validated = purchaseCostAnalysisSchema.parse(query);
      const data = await stockMgmtService.getPurchaseCostAnalysis({
        startDate: validated.startDate,
        endDate: validated.endDate,
        groupBy: validated.groupBy,
        feedItemId: validated.feedItemId,
        category: validated.category,
      });
      return c.json({ success: true, data });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Requête invalide', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // SP-8: Prédiction de rupture
  // ============================================
  async getStockoutPredictions(c: Context) {
    try {
      const query = {
        exploitationId: c.req.query('exploitationId'),
        consumptionWindowDays: c.req.query('consumptionWindowDays'),
        horizonDays: c.req.query('horizonDays'),
        includePurchaseLeadTime: c.req.query('includePurchaseLeadTime'),
      };
      const validated = stockoutPredictionSchema.parse(query);
      const data = await stockMgmtService.getStockoutPredictions({
        exploitationId: validated.exploitationId,
        consumptionWindowDays: validated.consumptionWindowDays,
        horizonDays: validated.horizonDays,
        includePurchaseLeadTime: validated.includePurchaseLeadTime,
      });
      return c.json({ success: true, data });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Requête invalide', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // US-7.4: FCR / Efficacité alimentaire
  // ============================================
  async getFCR(c: Context) {
    try {
      const query = {
        startDate: c.req.query('startDate'),
        endDate: c.req.query('endDate'),
        groupBy: c.req.query('groupBy'),
        targetType: c.req.query('targetType'),
        batimentId: c.req.query('batimentId'),
        animalId: c.req.query('animalId'),
      };
      const validated = fcrAnalysisSchema.parse(query);
      const data = await stockMgmtService.getFCR({
        startDate: validated.startDate,
        endDate: validated.endDate,
        groupBy: validated.groupBy,
        targetType: validated.targetType,
        batimentId: validated.batimentId,
        animalId: validated.animalId,
      });
      return c.json({ success: true, data });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Requête invalide', errors: error.errors || error.message },
        400
      );
    }
  },

  async getFoodCostPerAnimal(c: Context) {
    try {
      const query = {
        startDate: c.req.query('startDate'),
        endDate: c.req.query('endDate'),
        groupBy: c.req.query('groupBy'),
      };
      const validated = foodCostPerAnimalSchema.parse(query);
      const data = await stockMgmtService.getFoodCostPerAnimal({
        startDate: validated.startDate,
        endDate: validated.endDate,
        groupBy: validated.groupBy,
      });
      return c.json({ success: true, data });
    } catch (error: any) {
      return c.json(
        { success: false, message: 'Requête invalide', errors: error.errors || error.message },
        400
      );
    }
  },

  // ============================================
  // Synthèse US-7.3 (tableau de bord complet stock)
  // ============================================
  async getStockManagementDashboard(c: Context) {
    const exploitationId = c.req.query('exploitationId');
    const explIdNum = exploitationId ? Number(exploitationId) : undefined;

    try {
      const [stockByType, criticalAlerts, expiryAlerts, predictions] = await Promise.all([
        stockMgmtService.getStockByType({ exploitationId: explIdNum, includeEmpty: true }),
        stockMgmtService.getCriticalStockAlerts({ exploitationId: explIdNum }),
        stockMgmtService.getExpiryAlerts({
          daysWindow: 30,
          exploitationId: explIdNum,
          onlyWithStock: true,
        }),
        stockMgmtService.getStockoutPredictions({
          exploitationId: explIdNum,
          consumptionWindowDays: 30,
          horizonDays: 90,
          includePurchaseLeadTime: 7,
        }),
      ]);

      const totalItems = stockByType.reduce((s, g) => s + g.itemCount, 0);
      const totalStockValue = stockByType.reduce(
        (s, g) =>
          s +
          g.items.reduce(
            (sub: number, it: any) => sub + (Number(it.valueAtCost) || 0),
            0
          ),
        0
      );

      return c.json({
        success: true,
        data: {
          overview: {
            totalItems,
            categories: stockByType.length,
            totalStockValue: totalStockValue.toFixed(2),
          },
          criticalAlerts: criticalAlerts.summary,
          expiryAlerts: expiryAlerts.summary,
          predictions: predictions.summary,
          stockByType,
          topCriticalItems: criticalAlerts.alerts.slice(0, 5),
          soonExpiringBatches: expiryAlerts.alerts.slice(0, 5),
          highRiskStockouts: predictions.predictions
            .filter((p) => ['CRITICAL', 'HIGH'].includes(p.riskLevel))
            .slice(0, 5),
        },
      });
    } catch (error: any) {
      console.error('Dashboard stock error:', error);
      return c.json(
        { success: false, message: error.message || 'Erreur chargement dashboard stock' },
        500
      );
    }
  },
};
