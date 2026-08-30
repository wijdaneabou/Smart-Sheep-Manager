// src/services/prediction.service.ts
import { db } from '../db/connection.js';
import { predictions, NewPrediction } from '../db/schema/predictions.js';
import { animals } from '../db/schema/animals.js';
import { animalWeightRecords } from '../db/schema/animalWeightRecords.js';
import { animalBcsRecords } from '../db/schema/animalBcsRecords.js';
import { iotShields } from '../db/schema/iotShields.js';
import { iotSensorData } from '../db/schema/iotSensorData.js';
import { eq, desc, inArray, and, sql } from 'drizzle-orm';
import { getAnimalFeatures, AnimalFeatures, DataCompleteness } from './features.service.js';
import { mlApiClient, MlPredictionResponse } from '../utils/ml-api.client.js';
import { getUserExploitationIds } from '../utils/permissions.js';

export interface PredictionResult {
  animalId: number;
  prediction: number;
  probability: number;
  riskLevel: string;
  thresholdUsed: number;
  profileUsed: string;
  explanations: Record<string, number>;
  featureValues: Record<string, any>;
  createdAt?: Date;
  dataStatus?: DataCompleteness;
  // Animal display fields
  animalName?: string | null;
  animalRfid?: string | null;
  animalPhoto?: string | null;
  animalWeight?: number | null;
  // Current real-time stats
  currentWeight?: number | null;
  currentBcs?: number | null;
  currentTemperature?: number | null;
  currentActivity?: string | null;
  lastMeasuredAt?: Date | null;
}

export interface BatchPredictionResult {
  animalId: number;
  success: boolean;
  prediction?: PredictionResult;
  error?: string;
}

export interface PredictionStatistics {
  totalPredictions: number;
  highRisk: number;
  moderateRisk: number;
  lowRisk: number;
  averageProbability: number;
  recentPredictions: PredictionResult[];
}

export class PredictionService {
  /**
   * Predict disease for a single animal with permission check.
   */
  async predictAnimal(
    animalId: number,
    profile: string = 'high_recall',
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<PredictionResult> {
    // Check permission
    const hasAccess = await this.canAccessAnimal(animalId, user);
    if (!hasAccess) {
      throw new Error('You do not have permission to view this animal.');
    }

    console.log(`[Prediction] 🔮 Starting prediction for animal ${animalId}...`);

    try {
      // Fetch animal details including name, RFID, photo, and weight
      const animalResult = await db
        .select({
          id: animals.id,
          name: animals.name,
          rfid: animals.rfid,
          photoUrl: animals.photoUrl,
          weight: animals.weight,
        })
        .from(animals)
        .where(eq(animals.id, animalId))
        .limit(1);

      if (!animalResult || animalResult.length === 0) {
        throw new Error(`Animal with ID ${animalId} not found`);
      }

      const animal = animalResult[0];

      console.log(`[Prediction] 📊 Fetching features for animal ${animalId}...`);
      const featuresWithStatus = await getAnimalFeatures(animalId);
      const { dataStatus, ...features } = featuresWithStatus;

      // CHECK DATA COMPLETENESS
      if (!dataStatus.hasMinimumData) {
        const missingList = dataStatus.missingCategories.join(', ');
        throw new Error(
          `Insufficient data for reliable prediction. Missing: ${missingList}. ` +
          `At least BCS or IoT data is required.`
        );
      }

      console.log(`[Prediction] 🧠 Calling ML API for animal ${animalId}...`);
      const mlResult = await mlApiClient.predictAnimal(features, profile);

      console.log(`[Prediction] 💾 Saving prediction for animal ${animalId}...`);
      await this.savePrediction(animalId, mlResult);

      // Fetch latest real-time data
      const latestWeight = await db
        .select({ weight: animalWeightRecords.weight, date: animalWeightRecords.date })
        .from(animalWeightRecords)
        .where(eq(animalWeightRecords.animalId, animalId))
        .orderBy(desc(animalWeightRecords.date))
        .limit(1);

      const latestBcs = await db
        .select({ bcsScore: animalBcsRecords.bcsScore, date: animalBcsRecords.date })
        .from(animalBcsRecords)
        .where(eq(animalBcsRecords.animalId, animalId))
        .orderBy(desc(animalBcsRecords.date))
        .limit(1);

      // IoT: find active shield and its latest reading
      const shields = await db
        .select({ id: iotShields.id })
        .from(iotShields)
        .where(
          and(
            eq(iotShields.animalId, animalId),
            eq(iotShields.status, 'ACTIVE')
          )
        )
        .limit(1);

      let latestSensor: { temperature: number | null; activity: string | null; measuredAt: Date | null } | null = null;
      if (shields.length > 0) {
        const sensorData = await db
          .select({
            temperature: iotSensorData.temperature,
            activity: iotSensorData.activity,
            measuredAt: iotSensorData.measuredAt,
          })
          .from(iotSensorData)
          .where(eq(iotSensorData.shieldId, shields[0].id))
          .orderBy(desc(iotSensorData.measuredAt))
          .limit(1);
        if (sensorData.length > 0) {
          latestSensor = {
            temperature: sensorData[0].temperature ? Number(sensorData[0].temperature) : null,
            activity: sensorData[0].activity,
            measuredAt: sensorData[0].measuredAt,
          };
        }
      }

      const result: PredictionResult = {
        animalId,
        prediction: mlResult.prediction,
        probability: mlResult.probability,
        riskLevel: mlResult.risk_level,
        thresholdUsed: mlResult.threshold_used,
        profileUsed: mlResult.profile_used,
        explanations: mlResult.explanations,
        featureValues: mlResult.feature_values,
        createdAt: new Date(),
        dataStatus,
        // Current stats
        currentWeight: latestWeight.length > 0 ? Number(latestWeight[0].weight) : null,
        currentBcs: latestBcs.length > 0 ? Number(latestBcs[0].bcsScore) : null,
        currentTemperature: latestSensor?.temperature ?? null,
        currentActivity: latestSensor?.activity ?? null,
        lastMeasuredAt: latestSensor?.measuredAt ?? null,
        // Animal details from the animal table
        animalName: animal.name,
        animalRfid: animal.rfid,
        animalPhoto: animal.photoUrl,
        animalWeight: animal.weight ? Number(animal.weight) : null,
      };

      console.log(
        `[Prediction] ✅ Prediction complete for animal ${animalId}: ${result.riskLevel} (${(result.probability * 100).toFixed(1)}%)`
      );

      return result;
    } catch (error) {
      console.error(`[Prediction] ❌ Failed to predict for animal ${animalId}:`, error);
      throw error;
    }
  }

  /**
   * Batch prediction with permission checks.
   */
  async predictBatch(
    animalIds: number[],
    profile: string = 'high_recall',
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<BatchPredictionResult[]> {
    console.log(`[Prediction] 🔮 Starting batch prediction for ${animalIds.length} animals...`);

    const results: BatchPredictionResult[] = [];

    for (const animalId of animalIds) {
      try {
        const prediction = await this.predictAnimal(animalId, profile, user);
        results.push({
          animalId,
          success: true,
          prediction,
        });
      } catch (error) {
        console.error(`[Prediction] ❌ Failed for animal ${animalId}:`, error);
        results.push({
          animalId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(
      `[Prediction] ✅ Batch prediction complete: ${successCount}/${animalIds.length} succeeded`
    );

    return results;
  }

  /**
   * Save prediction to database.
   */
  private async savePrediction(
    animalId: number,
    mlResult: MlPredictionResponse
  ): Promise<void> {
    try {
      const insertData: NewPrediction = {
        animalId: animalId,
        prediction: mlResult.prediction,
        probability: mlResult.probability.toString(),
        riskLevel: mlResult.risk_level,
        thresholdUsed: mlResult.threshold_used.toString(),
        profileUsed: mlResult.profile_used,
        explanations: JSON.stringify(mlResult.explanations),
        featureValues: JSON.stringify(mlResult.feature_values),
      };

      await db.insert(predictions).values(insertData);
      console.log(`[Prediction] 💾 Prediction saved for animal ${animalId}`);
    } catch (error) {
      console.error(`[Prediction] ❌ Failed to save prediction for animal ${animalId}:`, error);
    }
  }

  /**
   * Get latest prediction for an animal (with permission check).
   */
  async getLatestPrediction(
    animalId: number,
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<PredictionResult | null> {
    // Check permission
    const hasAccess = await this.canAccessAnimal(animalId, user);
    if (!hasAccess) {
      return null;
    }

    try {
      const result = await db
        .select()
        .from(predictions)
        .where(eq(predictions.animalId, animalId))
        .orderBy(desc(predictions.createdAt))
        .limit(1);

      if (!result || result.length === 0) {
        return null;
      }

      const row = result[0];

      return {
        animalId: row.animalId,
        prediction: row.prediction,
        probability: Number(row.probability),
        riskLevel: row.riskLevel,
        thresholdUsed: Number(row.thresholdUsed),
        profileUsed: row.profileUsed,
        explanations: row.explanations ? JSON.parse(row.explanations as string) : {},
        featureValues: row.featureValues ? JSON.parse(row.featureValues as string) : {},
        createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      };
    } catch (error) {
      console.error(`[Prediction] ❌ Failed to get latest prediction for ${animalId}:`, error);
      return null;
    }
  }

  /**
   * Get prediction history for an animal (with permission check).
   */
  async getAnimalPredictionHistory(
    animalId: number,
    limit: number = 10,
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<PredictionResult[]> {
    // Check permission
    const hasAccess = await this.canAccessAnimal(animalId, user);
    if (!hasAccess) {
      return [];
    }

    try {
      const results = await db
        .select()
        .from(predictions)
        .where(eq(predictions.animalId, animalId))
        .orderBy(desc(predictions.createdAt))
        .limit(limit);

      return results.map((row) => ({
        animalId: row.animalId,
        prediction: row.prediction,
        probability: Number(row.probability),
        riskLevel: row.riskLevel,
        thresholdUsed: Number(row.thresholdUsed),
        profileUsed: row.profileUsed,
        explanations: row.explanations ? JSON.parse(row.explanations as string) : {},
        featureValues: row.featureValues ? JSON.parse(row.featureValues as string) : {},
        createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
      }));
    } catch (error) {
      console.error(`[Prediction] ❌ Failed to get history for ${animalId}:`, error);
      return [];
    }
  }

  /**
   * Get risky animals (filtered by exploitation) – returns only the latest prediction per animal.
   * Also includes animal name, RFID, photo, and current weight for display.
   */
  async getRiskyAnimals(
    minProbability: number = 0.4,
    limit: number = 50,
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<PredictionResult[]> {
    try {
      const exploitationIds = await getUserExploitationIds(
        user.id,
        user.roleName || '',
        user.roleId
      );

      if (exploitationIds !== null && exploitationIds.length === 0) {
        return [];
      }

      // 1. Subquery: latest prediction ID per animal with risk level 'Élevé'
      const latestIds = await db
        .select({ maxId: sql`MAX(${predictions.id})` })
        .from(predictions)
        .where(eq(predictions.riskLevel, 'Élevé'))
        .groupBy(predictions.animalId);

      const ids = latestIds.map((row) => row.maxId as number);

      if (ids.length === 0) {
        return [];
      }

      // 2. Full query with joins and filters
      const conditions: any[] = [inArray(predictions.id, ids)];
      if (exploitationIds !== null) {
        conditions.push(inArray(animals.exploitationId, exploitationIds));
      }

      const results = await db
        .select()
        .from(predictions)
        .innerJoin(animals, eq(predictions.animalId, animals.id))
        .where(and(...conditions))
        .orderBy(desc(predictions.probability))
        .limit(limit);

      return results.map((row) => ({
        animalId: row.predictions.animalId,
        prediction: row.predictions.prediction,
        probability: Number(row.predictions.probability),
        riskLevel: row.predictions.riskLevel,
        thresholdUsed: Number(row.predictions.thresholdUsed),
        profileUsed: row.predictions.profileUsed,
        explanations: row.predictions.explanations
          ? JSON.parse(row.predictions.explanations as string)
          : {},
        featureValues: row.predictions.featureValues
          ? JSON.parse(row.predictions.featureValues as string)
          : {},
        createdAt: row.predictions.createdAt
          ? new Date(row.predictions.createdAt)
          : undefined,
        // Animal details from joined table
        animalName: row.animals.name,
        animalRfid: row.animals.rfid,
        animalPhoto: row.animals.photoUrl,
        animalWeight: row.animals.weight ? Number(row.animals.weight) : null,
      }));
    } catch (error) {
      console.error(`[Prediction] ❌ Failed to get risky animals:`, error);
      return [];
    }
  }

  /**
   * Get statistics (filtered by exploitation) – based on the latest prediction per animal.
   */
  async getStatistics(
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<PredictionStatistics> {
    try {
      const exploitationIds = await getUserExploitationIds(
        user.id,
        user.roleName || '',
        user.roleId
      );

      if (exploitationIds !== null && exploitationIds.length === 0) {
        return {
          totalPredictions: 0,
          highRisk: 0,
          moderateRisk: 0,
          lowRisk: 0,
          averageProbability: 0,
          recentPredictions: [],
        };
      }

      // 1. Get the latest prediction ID for each animal (any risk level)
      const latestPerAnimal = await db
        .select({
          animalId: predictions.animalId,
          maxId: sql`MAX(${predictions.id})`,
        })
        .from(predictions)
        .groupBy(predictions.animalId);

      const latestIds = latestPerAnimal.map((row) => row.maxId as number);

      if (latestIds.length === 0) {
        return {
          totalPredictions: 0,
          highRisk: 0,
          moderateRisk: 0,
          lowRisk: 0,
          averageProbability: 0,
          recentPredictions: [],
        };
      }

      // 2. Fetch those latest predictions with exploitation filter
      const conditions: any[] = [inArray(predictions.id, latestIds)];
      if (exploitationIds !== null) {
        conditions.push(inArray(animals.exploitationId, exploitationIds));
      }

      const allLatest = await db
        .select()
        .from(predictions)
        .innerJoin(animals, eq(predictions.animalId, animals.id))
        .where(and(...conditions));

      // 3. Compute statistics
      const total = allLatest.length;
      const highRisk = allLatest.filter((p) => p.predictions.riskLevel === 'Élevé').length;
      const moderateRisk = allLatest.filter((p) => p.predictions.riskLevel === 'Modéré').length;
      const lowRisk = allLatest.filter((p) => p.predictions.riskLevel === 'Faible').length;

      const probabilities = allLatest.map((p) => Number(p.predictions.probability));
      const avgProbability =
        probabilities.length > 0
          ? probabilities.reduce((a, b) => a + b, 0) / probabilities.length
          : 0;

      // 4. Get 5 most recent predictions (global, for display)
      const recent = allLatest
        .sort(
          (a, b) =>
            new Date(b.predictions.createdAt).getTime() -
            new Date(a.predictions.createdAt).getTime()
        )
        .slice(0, 5);

      const recentPredictions = recent.map((row) => ({
        animalId: row.predictions.animalId,
        prediction: row.predictions.prediction,
        probability: Number(row.predictions.probability),
        riskLevel: row.predictions.riskLevel,
        thresholdUsed: Number(row.predictions.thresholdUsed),
        profileUsed: row.predictions.profileUsed,
        explanations: row.predictions.explanations
          ? JSON.parse(row.predictions.explanations as string)
          : {},
        featureValues: row.predictions.featureValues
          ? JSON.parse(row.predictions.featureValues as string)
          : {},
        createdAt: row.predictions.createdAt
          ? new Date(row.predictions.createdAt)
          : undefined,
        // Animal details (allow null)
        animalName: row.animals.name,
        animalRfid: row.animals.rfid,
        animalPhoto: row.animals.photoUrl,
        animalWeight: row.animals.weight ? Number(row.animals.weight) : null,
      }));

      return {
        totalPredictions: total,
        highRisk,
        moderateRisk,
        lowRisk,
        averageProbability: avgProbability,
        recentPredictions,
      };
    } catch (error) {
      console.error(`[Prediction] ❌ Failed to get statistics:`, error);
      return {
        totalPredictions: 0,
        highRisk: 0,
        moderateRisk: 0,
        lowRisk: 0,
        averageProbability: 0,
        recentPredictions: [],
      };
    }
  }

  /**
   * Check if user can access a specific animal.
   */
  private async canAccessAnimal(
    animalId: number,
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<boolean> {
    const exploitationIds = await getUserExploitationIds(
      user.id,
      user.roleName || '',
      user.roleId
    );

    // Admin/cooperative sees all
    if (exploitationIds === null) return true;

    // No access to any exploitation
    if (exploitationIds.length === 0) return false;

    // Get animal's exploitation
    const animal = await db
      .select({ exploitationId: animals.exploitationId })
      .from(animals)
      .where(eq(animals.id, animalId))
      .limit(1);

    if (!animal || animal.length === 0) return false;
    const expId = animal[0].exploitationId;

    // Animal without exploitation: only admin can see
    if (expId === null) return false;

    return exploitationIds.includes(expId);
  }

  /**
   * Check ML service availability.
   */
  async isMlServiceAvailable(): Promise<boolean> {
    return mlApiClient.isAvailable();
  }

  /**
   * Get ML service health.
   */
  async getMlServiceHealth(): Promise<{
    status: string;
    model_loaded: boolean;
    thresholds?: Record<string, number>;
  }> {
    return mlApiClient.healthCheck();
  }

  // ============================================================
  // ✅ GET TREND DATA (Last 7 days)
  // ============================================================

  /**
   * Get prediction counts for the last 7 days.
   * Returns an array of daily counts.
   */
  async getPredictionTrend(
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<{ date: string; count: number }[]> {
    try {
      const exploitationIds = await getUserExploitationIds(
        user.id,
        user.roleName || '',
        user.roleId
      );

      // Build query with exploitation filter
      let query = db
        .select({
          date: sql`DATE(${predictions.createdAt})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(predictions)
        .innerJoin(animals, eq(predictions.animalId, animals.id))
        .where(
          and(
            sql`${predictions.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            exploitationIds !== null
              ? inArray(animals.exploitationId, exploitationIds)
              : undefined
          )
        )
        .groupBy(sql`DATE(${predictions.createdAt})`)
        .orderBy(sql`DATE(${predictions.createdAt})`);

      const results = await query;

      // Fill missing days with 0
      const trendMap = new Map();
      results.forEach((r) => {
        trendMap.set(r.date, Number(r.count));
      });

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        days.push({
          date: dateStr,
          count: trendMap.get(dateStr) || 0,
        });
      }

      return days;
    } catch (error) {
      console.error(`[Prediction] ❌ Failed to get prediction trend:`, error);
      return [];
    }
  }

  // ============================================================
  // ✅ GET ALL ANIMALS WITH PREDICTIONS
  // ============================================================

  /**
   * Get all animals with their latest predictions (all risk levels).
   * Returns the latest prediction per animal, sorted by probability descending.
   */
  async getAllAnimalsWithPredictions(
    limit: number = 50,
    user: { id: number; roleName: string; roleId?: number }
  ): Promise<PredictionResult[]> {
    try {
      const exploitationIds = await getUserExploitationIds(
        user.id,
        user.roleName || '',
        user.roleId
      );

      if (exploitationIds !== null && exploitationIds.length === 0) {
        return [];
      }

      // 1. Get the latest prediction ID for each animal (any risk level)
      const latestPerAnimal = await db
        .select({
          animalId: predictions.animalId,
          maxId: sql`MAX(${predictions.id})`,
        })
        .from(predictions)
        .groupBy(predictions.animalId);

      const latestIds = latestPerAnimal.map((row) => row.maxId as number);

      if (latestIds.length === 0) {
        return [];
      }

      // 2. Fetch those latest predictions with exploitation filter
      const conditions: any[] = [inArray(predictions.id, latestIds)];
      if (exploitationIds !== null) {
        conditions.push(inArray(animals.exploitationId, exploitationIds));
      }

      const results = await db
        .select()
        .from(predictions)
        .innerJoin(animals, eq(predictions.animalId, animals.id))
        .where(and(...conditions))
        .orderBy(desc(predictions.probability))
        .limit(limit);

      return results.map((row) => ({
        animalId: row.predictions.animalId,
        prediction: row.predictions.prediction,
        probability: Number(row.predictions.probability),
        riskLevel: row.predictions.riskLevel,
        thresholdUsed: Number(row.predictions.thresholdUsed),
        profileUsed: row.predictions.profileUsed,
        explanations: row.predictions.explanations
          ? JSON.parse(row.predictions.explanations as string)
          : {},
        featureValues: row.predictions.featureValues
          ? JSON.parse(row.predictions.featureValues as string)
          : {},
        createdAt: row.predictions.createdAt
          ? new Date(row.predictions.createdAt)
          : undefined,
        animalName: row.animals.name,
        animalRfid: row.animals.rfid,
        animalPhoto: row.animals.photoUrl,
        animalWeight: row.animals.weight ? Number(row.animals.weight) : null,
      }));
    } catch (error) {
      console.error(`[Prediction] ❌ Failed to get all animals with predictions:`, error);
      return [];
    }
  }
}

export const predictionService = new PredictionService();