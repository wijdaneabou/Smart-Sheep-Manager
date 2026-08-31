import { Hono } from 'hono';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';
import { FeedingController } from '../controllers/feeding.controller.js';

const feedingRoutes = new Hono();

feedingRoutes.use('*', isAuthenticated);

// ============================================
// Dashboard / Report
// ============================================

feedingRoutes.get(
  '/report',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedingReport
);

// ============================================
// Feed Items (Inventaire)
// ============================================

feedingRoutes.get(
  '/items',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedItems
);

feedingRoutes.get(
  '/items/low-stock',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getLowStockItems
);

feedingRoutes.get(
  '/items/:id',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedItemById
);

feedingRoutes.post(
  '/items',
  requirePermission('FEEDING', 'CREATE'),
  FeedingController.createFeedItem
);

feedingRoutes.put(
  '/items/:id',
  requirePermission('FEEDING', 'UPDATE'),
  FeedingController.updateFeedItem
);

feedingRoutes.delete(
  '/items/:id',
  requirePermission('FEEDING', 'DELETE'),
  FeedingController.deleteFeedItem
);

// ============================================
// Feed Stocks (Mouvements)
// ============================================

feedingRoutes.get(
  '/stocks/item/:feedItemId',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedStocksByItem
);

feedingRoutes.get(
  '/stocks/:id',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedStockById
);

feedingRoutes.post(
  '/stocks',
  requirePermission('FEEDING', 'CREATE'),
  FeedingController.createFeedStock
);

feedingRoutes.put(
  '/stocks/:id',
  requirePermission('FEEDING', 'UPDATE'),
  FeedingController.updateFeedStock
);

feedingRoutes.delete(
  '/stocks/:id',
  requirePermission('FEEDING', 'DELETE'),
  FeedingController.deleteFeedStock
);

// ============================================
// Feed Rations (Formules)
// ============================================

feedingRoutes.get(
  '/rations',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedRations
);

feedingRoutes.get(
  '/rations/:id',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedRationById
);

feedingRoutes.post(
  '/rations',
  requirePermission('FEEDING', 'CREATE'),
  FeedingController.createFeedRation
);

feedingRoutes.put(
  '/rations/:id',
  requirePermission('FEEDING', 'UPDATE'),
  FeedingController.updateFeedRation
);

feedingRoutes.delete(
  '/rations/:id',
  requirePermission('FEEDING', 'DELETE'),
  FeedingController.deleteFeedRation
);

// ============================================
// Feed Distributions
// ============================================

feedingRoutes.get(
  '/distributions',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedDistributions
);

feedingRoutes.get(
  '/distributions/:id',
  requirePermission('FEEDING', 'READ'),
  FeedingController.getFeedDistributionById
);

feedingRoutes.post(
  '/distributions',
  requirePermission('FEEDING', 'CREATE'),
  FeedingController.createFeedDistribution
);

feedingRoutes.put(
  '/distributions/:id',
  requirePermission('FEEDING', 'UPDATE'),
  FeedingController.updateFeedDistribution
);

feedingRoutes.delete(
  '/distributions/:id',
  requirePermission('FEEDING', 'DELETE'),
  FeedingController.deleteFeedDistribution
);

export default feedingRoutes;
