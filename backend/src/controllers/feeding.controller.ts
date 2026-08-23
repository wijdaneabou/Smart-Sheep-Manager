import { Context } from 'hono';
import { FeedingService } from '../services/feeding.service.js';
import {
  createFeedItemSchema,
  updateFeedItemSchema,
  createFeedStockSchema,
  updateFeedStockSchema,
  createFeedRationSchema,
  updateFeedRationSchema,
  createFeedRationItemSchema,
  updateFeedRationItemSchema,
  createFeedDistributionSchema,
  updateFeedDistributionSchema,
} from '../validators/feeding.validator.js';

const feedingService = new FeedingService();

export const FeedingController = {
  // ============================================
  // US-7.1: Feed Items (Inventaire)
  // ============================================

  async getFeedItems(c: Context) {
    const exploitationId = c.req.query('exploitationId');
    const items = await feedingService.getFeedItems(
      exploitationId ? Number(exploitationId) : undefined
    );
    return c.json({ success: true, data: items });
  },

  async getFeedItemById(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    const item = await feedingService.getFeedItemById(id);
    if (!item) {
      return c.json({ success: false, message: 'Article non trouvé' }, 404);
    }
    return c.json({ success: true, data: item });
  },

  async createFeedItem(c: Context) {
    const user = c.get('user') as { id: number } | undefined;
    const body = await c.req.json();
    try {
      const validated = createFeedItemSchema.parse(body);
      const item = await feedingService.createFeedItem({
        ...validated,
        createdBy: user?.id ?? null,
      });
      return c.json({ success: true, data: item }, 201);
    } catch (error: any) {
      console.error('Erreur création article:', error);
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateFeedItem(c: Context) {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      const validated = updateFeedItemSchema.parse(body);
      const item = await feedingService.updateFeedItem(id, validated);
      if (!item) {
        return c.json({ success: false, message: 'Article non trouvé' }, 404);
      }
      return c.json({ success: true, data: item });
    } catch (error: any) {
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async deleteFeedItem(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      await feedingService.deleteFeedItem(id);
      return c.json({ success: true, message: 'Article supprimé avec succès' });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur suppression' }, 400);
    }
  },

  async getLowStockItems(c: Context) {
    const exploitationId = c.req.query('exploitationId');
    const items = await feedingService.getLowStockItems(
      exploitationId ? Number(exploitationId) : undefined
    );
    return c.json({ success: true, data: items });
  },

  // ============================================
  // US-7.2: Feed Stocks (Mouvements)
  // ============================================

  async getFeedStocksByItem(c: Context) {
    const feedItemId = Number(c.req.param('feedItemId'));
    if (isNaN(feedItemId)) {
      return c.json({ success: false, message: 'ID article invalide' }, 400);
    }
    const stocks = await feedingService.getFeedStocksByItem(feedItemId);
    return c.json({ success: true, data: stocks });
  },

  async getFeedStockById(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    const stock = await feedingService.getFeedStockById(id);
    if (!stock) {
      return c.json({ success: false, message: 'Mouvement non trouvé' }, 404);
    }
    return c.json({ success: true, data: stock });
  },

  async createFeedStock(c: Context) {
    const user = c.get('user') as { id: number } | undefined;
    const body = await c.req.json();
    try {
      const validated = createFeedStockSchema.parse(body);
      const stock = await feedingService.createFeedStock({
        ...validated,
        movementDate: new Date(validated.movementDate),
        expiryDate: validated.expiryDate ? new Date(validated.expiryDate) : undefined,
        recordedBy: user?.id ?? null,
      });
      return c.json({ success: true, data: stock }, 201);
    } catch (error: any) {
      console.error('Erreur création mouvement stock:', error);
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateFeedStock(c: Context) {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      const validated = updateFeedStockSchema.parse(body);
      const data: any = { ...validated };
      if (validated.movementDate) data.movementDate = new Date(validated.movementDate);
      if (validated.expiryDate !== undefined) data.expiryDate = validated.expiryDate ? new Date(validated.expiryDate) : null;
      const stock = await feedingService.updateFeedStock(id, data);
      if (!stock) {
        return c.json({ success: false, message: 'Mouvement non trouvé' }, 404);
      }
      return c.json({ success: true, data: stock });
    } catch (error: any) {
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async deleteFeedStock(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      await feedingService.deleteFeedStock(id);
      return c.json({ success: true, message: 'Mouvement supprimé avec succès' });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur suppression' }, 400);
    }
  },

  // ============================================
  // US-7.1 (réciproque): Feed Rations (Formulation)
  // ============================================

  async getFeedRations(c: Context) {
    const exploitationId = c.req.query('exploitationId');
    const rations = await feedingService.getFeedRations(
      exploitationId ? Number(exploitationId) : undefined
    );
    return c.json({ success: true, data: rations });
  },

  async getFeedRationById(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    const ration = await feedingService.getFeedRationById(id);
    if (!ration) {
      return c.json({ success: false, message: 'Ration non trouvée' }, 404);
    }
    return c.json({ success: true, data: ration });
  },

  async createFeedRation(c: Context) {
    const user = c.get('user') as { id: number } | undefined;
    const body = await c.req.json();
    try {
      const validated = createFeedRationSchema.parse(body);
      const ration = await feedingService.createFeedRation({
        ...validated,
        createdBy: user?.id ?? null,
      });
      return c.json({ success: true, data: ration }, 201);
    } catch (error: any) {
      console.error('Erreur création ration:', error);
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateFeedRation(c: Context) {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      const validated = updateFeedRationSchema.parse(body);
      const ration = await feedingService.updateFeedRation(id, validated);
      if (!ration) {
        return c.json({ success: false, message: 'Ration non trouvée' }, 404);
      }
      return c.json({ success: true, data: ration });
    } catch (error: any) {
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async deleteFeedRation(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      await feedingService.deleteFeedRation(id);
      return c.json({ success: true, message: 'Ration supprimée avec succès' });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur suppression' }, 400);
    }
  },

  // ============================================
  // Feed Distribution (US-7.4)
  // ============================================

  async getFeedDistributions(c: Context) {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const targetType = c.req.query('targetType');
    const batimentId = c.req.query('batimentId');
    const animalId = c.req.query('animalId');

    const dists = await feedingService.getFeedDistributions({
      startDate,
      endDate,
      targetType,
      batimentId: batimentId ? Number(batimentId) : undefined,
      animalId: animalId ? Number(animalId) : undefined,
    });
    return c.json({ success: true, data: dists });
  },

  async getFeedDistributionById(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    const dist = await feedingService.getFeedDistributionById(id);
    if (!dist) {
      return c.json({ success: false, message: 'Distribution non trouvée' }, 404);
    }
    return c.json({ success: true, data: dist });
  },

  async createFeedDistribution(c: Context) {
    const user = c.get('user') as { id: number } | undefined;
    const body = await c.req.json();
    try {
      const validated = createFeedDistributionSchema.parse(body);
      const dist = await feedingService.createFeedDistribution({
        ...validated,
        distributionDate: new Date(validated.distributionDate),
        distributedBy: user?.id ?? null,
      });
      return c.json({ success: true, data: dist }, 201);
    } catch (error: any) {
      console.error('Erreur création distribution:', error);
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async updateFeedDistribution(c: Context) {
    const id = Number(c.req.param('id'));
    const body = await c.req.json();
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      const validated = updateFeedDistributionSchema.parse(body);
      const data: any = { ...validated };
      if (validated.distributionDate) data.distributionDate = new Date(validated.distributionDate);
      const dist = await feedingService.updateFeedDistribution(id, data);
      if (!dist) {
        return c.json({ success: false, message: 'Distribution non trouvée' }, 404);
      }
      return c.json({ success: true, data: dist });
    } catch (error: any) {
      return c.json({ success: false, message: 'Données invalides', errors: error.errors || error.message }, 400);
    }
  },

  async deleteFeedDistribution(c: Context) {
    const id = Number(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, message: 'ID invalide' }, 400);
    }
    try {
      await feedingService.deleteFeedDistribution(id);
      return c.json({ success: true, message: 'Distribution supprimée avec succès' });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur suppression' }, 400);
    }
  },

  // ============================================
  // US-7.5: Feeding Report
  // ============================================

  async getFeedingReport(c: Context) {
    try {
      const report = await feedingService.getFeedingReport();
      return c.json({ success: true, data: report });
    } catch (error: any) {
      console.error('Erreur rapport alimentation:', error);
      return c.json({ success: false, message: error.message || 'Erreur génération rapport' }, 500);
    }
  },
};
