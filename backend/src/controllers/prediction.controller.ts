// src/controllers/prediction.controller.ts
import { Context } from 'hono';
import { predictionService } from '../services/prediction.service.js';
import { getUserExploitationIds } from '../utils/permissions.js';

/**
 * Controller for handling prediction-related HTTP requests.
 */
export class PredictionController {
  /**
   * Predict disease for a single animal.
   * GET /api/predictions/animal/:id?profile=high_recall
   */
  async predictAnimal(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const idParam = c.req.param('id');
      if (!idParam) {
        return c.json(
          { error: 'Animal ID is required.' },
          400
        );
      }

      const animalId = parseInt(idParam);
      const profile = c.req.query('profile') || 'high_recall';

      if (isNaN(animalId) || animalId <= 0) {
        return c.json(
          { error: 'Invalid animal ID. Must be a positive integer.' },
          400
        );
      }

      const validProfiles = ['conservative', 'balanced', 'high_recall'];
      if (!validProfiles.includes(profile)) {
        return c.json(
          { error: `Invalid profile. Must be one of: ${validProfiles.join(', ')}` },
          400
        );
      }

      const result = await predictionService.predictAnimal(animalId, profile, user);

      return c.json({
        success: true,
        data: result,
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in predictAnimal:', error);

      if (error instanceof Error) {
        // Handle insufficient data error
        if (error.message.includes('Insufficient data')) {
          const missingMatch = error.message.match(/Missing: (.*?)\./);
          const missingFields = missingMatch ? missingMatch[1].split(', ') : [];
          return c.json({
            success: false,
            error: error.message,
            code: 'INSUFFICIENT_DATA',
            details: { missingFields },
          }, 422);
        }

        if (error.message.includes('permission') || error.message.includes('not found')) {
          return c.json(
            { error: error.message },
            403
          );
        }
        if (error.message.includes('not found')) {
          return c.json(
            { error: error.message },
            404
          );
        }
      }

      return c.json(
        { error: 'Failed to predict for animal. Please try again later.' },
        500
      );
    }
  }

  /**
   * Predict disease for multiple animals in batch.
   * POST /api/predictions/batch
   * Body: { animalIds: number[], profile?: string }
   */
  async predictBatch(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      const { animalIds, profile = 'high_recall' } = body;

      if (!animalIds || !Array.isArray(animalIds) || animalIds.length === 0) {
        return c.json(
          { error: 'animalIds must be a non-empty array of integers.' },
          400
        );
      }

      const invalidIds = animalIds.filter(id => !Number.isInteger(id) || id <= 0);
      if (invalidIds.length > 0) {
        return c.json(
          { error: `Invalid animal IDs: ${invalidIds.join(', ')}. Must be positive integers.` },
          400
        );
      }

      if (animalIds.length > 100) {
        return c.json(
          { error: 'Batch size exceeds maximum allowed (100).' },
          400
        );
      }

      const validProfiles = ['conservative', 'balanced', 'high_recall'];
      if (!validProfiles.includes(profile)) {
        return c.json(
          { error: `Invalid profile. Must be one of: ${validProfiles.join(', ')}` },
          400
        );
      }

      const results = await predictionService.predictBatch(animalIds, profile, user);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      return c.json({
        success: true,
        summary: {
          total: results.length,
          succeeded: successCount,
          failed: failureCount,
        },
        data: results,
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in predictBatch:', error);

      if (error instanceof Error && error.message.includes('Insufficient data')) {
        const missingMatch = error.message.match(/Missing: (.*?)\./);
        const missingFields = missingMatch ? missingMatch[1].split(', ') : [];
        return c.json({
          success: false,
          error: error.message,
          code: 'INSUFFICIENT_DATA',
          details: { missingFields },
        }, 422);
      }

      return c.json(
        { error: 'Failed to process batch prediction. Please try again later.' },
        500
      );
    }
  }

  /**
   * Get the most recent prediction for an animal.
   * GET /api/predictions/animal/:id/latest
   */
  async getLatestPrediction(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const idParam = c.req.param('id');
      if (!idParam) {
        return c.json(
          { error: 'Animal ID is required.' },
          400
        );
      }

      const animalId = parseInt(idParam);

      if (isNaN(animalId) || animalId <= 0) {
        return c.json(
          { error: 'Invalid animal ID. Must be a positive integer.' },
          400
        );
      }

      const result = await predictionService.getLatestPrediction(animalId, user);

      if (!result) {
        return c.json(
          { error: `No prediction found for animal ${animalId}` },
          404
        );
      }

      return c.json({
        success: true,
        data: result,
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in getLatestPrediction:', error);

      if (error instanceof Error && error.message.includes('permission')) {
        return c.json(
          { error: error.message },
          403
        );
      }

      return c.json(
        { error: 'Failed to get latest prediction. Please try again later.' },
        500
      );
    }
  }

  /**
   * Get prediction history for an animal.
   * GET /api/predictions/animal/:id/history?limit=10
   */
  async getPredictionHistory(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const idParam = c.req.param('id');
      if (!idParam) {
        return c.json(
          { error: 'Animal ID is required.' },
          400
        );
      }

      const animalId = parseInt(idParam);
      const limitParam = c.req.query('limit') || '10';
      const limit = parseInt(limitParam);

      if (isNaN(animalId) || animalId <= 0) {
        return c.json(
          { error: 'Invalid animal ID. Must be a positive integer.' },
          400
        );
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return c.json(
          { error: 'Limit must be between 1 and 100.' },
          400
        );
      }

      const results = await predictionService.getAnimalPredictionHistory(animalId, limit, user);

      return c.json({
        success: true,
        count: results.length,
        data: results,
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in getPredictionHistory:', error);

      if (error instanceof Error && error.message.includes('permission')) {
        return c.json(
          { error: error.message },
          403
        );
      }

      return c.json(
        { error: 'Failed to get prediction history. Please try again later.' },
        500
      );
    }
  }

  /**
   * Get all animals with high-risk predictions (filtered by user's exploitations).
   * GET /api/predictions/risky-animals?min_probability=0.4&limit=50
   */
  async getRiskyAnimals(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const minProbParam = c.req.query('min_probability') || '0.4';
      const limitParam = c.req.query('limit') || '50';

      const minProbability = parseFloat(minProbParam);
      const limit = parseInt(limitParam);

      if (isNaN(minProbability) || minProbability < 0 || minProbability > 1) {
        return c.json(
          { error: 'min_probability must be between 0 and 1.' },
          400
        );
      }

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return c.json(
          { error: 'limit must be between 1 and 100.' },
          400
        );
      }

      const results = await predictionService.getRiskyAnimals(minProbability, limit, user);

      return c.json({
        success: true,
        count: results.length,
        min_probability: minProbability,
        data: results,
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in getRiskyAnimals:', error);

      if (error instanceof Error && error.message.includes('permission')) {
        return c.json(
          { error: error.message },
          403
        );
      }

      return c.json(
        { error: 'Failed to get risky animals. Please try again later.' },
        500
      );
    }
  }

  /**
   * Get dashboard statistics (filtered by user's exploitations).
   * GET /api/predictions/statistics?farm_id=123
   */
  async getStatistics(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const farmIdParam = c.req.query('farm_id');

      // If farmId is provided, verify user has access
      if (farmIdParam) {
        const farmId = parseInt(farmIdParam);
        if (isNaN(farmId) || farmId <= 0) {
          return c.json(
            { error: 'Invalid farm ID. Must be a positive integer.' },
            400
          );
        }

        const allowedIds = await getUserExploitationIds(
          user.id,
          user.roleName || '',
          user.roleId
        );

        // If user is not admin/coop, check access to this farm
        if (allowedIds !== null && !allowedIds.includes(farmId)) {
          return c.json(
            { error: 'You do not have access to this farm.' },
            403
          );
        }
      }

      const statistics = await predictionService.getStatistics(user);

      return c.json({
        success: true,
        data: statistics,
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in getStatistics:', error);

      if (error instanceof Error && error.message.includes('permission')) {
        return c.json(
          { error: error.message },
          403
        );
      }

      return c.json(
        { error: 'Failed to get statistics. Please try again later.' },
        500
      );
    }
  }

  /**
   * Check the health of the ML service.
   * GET /api/predictions/ml-health
   */
  async getMlHealth(c: Context): Promise<Response> {
    try {
      const health = await predictionService.getMlServiceHealth();

      const statusCode = health.status === 'healthy' ? 200 : 503;

      return c.json({
        success: health.status === 'healthy',
        data: health,
      }, statusCode);
    } catch (error) {
      console.error('[PredictionController] Error in getMlHealth:', error);

      return c.json(
        {
          success: false,
          error: 'Failed to check ML service health.',
          data: { status: 'unhealthy', model_loaded: false },
        },
        503
      );
    }
  }

  /**
   * Check the availability of the ML service (simplified).
   * GET /api/predictions/available
   */
  async isMlAvailable(c: Context): Promise<Response> {
    try {
      const isAvailable = await predictionService.isMlServiceAvailable();

      return c.json({
        success: true,
        data: {
          available: isAvailable,
        },
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in isMlAvailable:', error);

      return c.json(
        {
          success: false,
          data: {
            available: false,
            error: 'Failed to check ML service availability.',
          },
        },
        503
      );
    }
  }

  // ============================================================
  // ✅ GET TREND DATA
  // ============================================================

  /**
   * Get prediction trend for the last 7 days.
   * GET /api/predictions/trend
   */
  async getTrend(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const trend = await predictionService.getPredictionTrend(user);
      return c.json({
        success: true,
        data: trend,
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in getTrend:', error);
      return c.json(
        { error: 'Failed to get trend data.' },
        500
      );
    }
  }

  // ============================================================
  // ✅ GET ALL ANIMALS WITH PREDICTIONS
  // ============================================================

  /**
   * Get all animals with their latest predictions.
   * GET /api/predictions/all-animals?limit=50
   */
  async getAllAnimals(c: Context): Promise<Response> {
    try {
      const user = c.get('user');
      const limitParam = c.req.query('limit') || '50';
      const limit = parseInt(limitParam);

      if (isNaN(limit) || limit < 1 || limit > 100) {
        return c.json(
          { error: 'limit must be between 1 and 100.' },
          400
        );
      }

      const results = await predictionService.getAllAnimalsWithPredictions(limit, user);

      return c.json({
        success: true,
        count: results.length,
        data: results,
      }, 200);
    } catch (error) {
      console.error('[PredictionController] Error in getAllAnimals:', error);
      return c.json(
        { error: 'Failed to get animals with predictions.' },
        500
      );
    }
  }
}

export const predictionController = new PredictionController();