// src/routes/prediction.routes.ts
import { Hono } from 'hono';
import { predictionController } from '../controllers/prediction.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/rbac.middleware.js';
import { requirePermission } from '../middlewares/permissions.middleware.js';

const predictionRoutes = new Hono();

// ============================================================
// ✅ PUBLIC ROUTES (No authentication required)
// ============================================================

predictionRoutes.get('/available', async (c) => {
  return await predictionController.isMlAvailable(c);
});

predictionRoutes.get('/ml-health', async (c) => {
  return await predictionController.getMlHealth(c);
});

// ============================================================
// 🔒 PROTECTED ROUTES (Authentication + Permission checks)
// ============================================================

predictionRoutes.use('/*', isAuthenticated);

/**
 * Predict for a single animal.
 * GET /api/predictions/animal/:id?profile=high_recall
 */
predictionRoutes.get(
  '/animal/:id',
  requirePermission('AI', 'READ'),
  async (c) => {
    return await predictionController.predictAnimal(c);
  }
);

/**
 * Get the most recent prediction for an animal.
 * GET /api/predictions/animal/:id/latest
 */
predictionRoutes.get(
  '/animal/:id/latest',
  requirePermission('AI', 'READ'),
  async (c) => {
    return await predictionController.getLatestPrediction(c);
  }
);

/**
 * Get prediction history for an animal.
 * GET /api/predictions/animal/:id/history?limit=10
 */
predictionRoutes.get(
  '/animal/:id/history',
  requirePermission('AI', 'READ'),
  async (c) => {
    return await predictionController.getPredictionHistory(c);
  }
);

/**
 * Get all animals with high-risk predictions.
 * GET /api/predictions/risky-animals?min_probability=0.4&limit=50
 */
predictionRoutes.get(
  '/risky-animals',
  requirePermission('AI', 'READ'),
  async (c) => {
    return await predictionController.getRiskyAnimals(c);
  }
);

/**
 * Get dashboard statistics.
 * GET /api/predictions/statistics?farm_id=123
 */
predictionRoutes.get(
  '/statistics',
  requirePermission('AI', 'STATISTICS'),
  async (c) => {
    return await predictionController.getStatistics(c);
  }
);

// ✅ NEW: Get prediction trend for the last 7 days
/**
 * Get prediction trend data.
 * GET /api/predictions/trend
 */
predictionRoutes.get(
  '/trend',
  requirePermission('AI', 'STATISTICS'),
  async (c) => {
    return await predictionController.getTrend(c);
  }
);

// ✅ NEW: Get all animals with their latest predictions (any risk level)
/**
 * Get all animals with their latest predictions.
 * GET /api/predictions/all-animals?limit=50
 */
predictionRoutes.get(
  '/all-animals',
  requirePermission('AI', 'READ'),
  async (c) => {
    return await predictionController.getAllAnimals(c);
  }
);


/**
 * Batch prediction (Admin or Veterinarian only).
 * POST /api/predictions/batch
 */
predictionRoutes.post(
  '/batch',
  requireRole('ADMIN', 'VETERINAIRE'),
  requirePermission('AI', 'CREATE'),
  async (c) => {
    return await predictionController.predictBatch(c);
  }
);

export default predictionRoutes;