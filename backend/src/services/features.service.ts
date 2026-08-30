// src/services/features.service.ts
import { db } from '../db/connection.js';
import { animals } from '../db/schema/animals.js';
import { animalWeightRecords } from '../db/schema/animalWeightRecords.js';
import { animalBcsRecords } from '../db/schema/animalBcsRecords.js';
import { iotShields } from '../db/schema/iotShields.js';
import { iotSensorData } from '../db/schema/iotSensorData.js';
import { vaccinations } from '../db/schema/vaccinations.js';
import { reproductionCycles } from '../db/schema/reproductionCycles.js';
import { animalHealthRecords } from '../db/schema/animalHealthRecords.js';
import { and, eq, desc, gt, sql } from 'drizzle-orm';

export interface AnimalFeatures {
  breed: string;
  sex: string;
  age_days: number;
  has_bcs: number;
  bcs_last: number | null;
  bcs_mean_30d: number | null;
  bcs_count_30d: number | null;
  bcs_change_30d: number | null;
  days_since_last_bcs: number | null;
  has_iot: number;
  temp_mean_30d: number | null;
  temp_max_30d: number | null;
  temp_anomalies_30d: number | null;
  temp_last: number | null;
  rest_ratio_30d: number | null;
  movement_ratio_30d: number | null;
  grazing_ratio_30d: number | null;
  alert_count_30d: number | null;
  days_iot_data_30d: number | null;
  weight_last: number | null;
  weight_mean_30d: number | null;
  weight_change_30d: number | null;
  weight_count_30d: number | null;
  days_since_last_weight: number | null;
  vaccine_count: number;
  days_since_last_vaccine: number;
  repro_cycles_count: number;
  has_lambing: number;
  pregnancies_count: number;
  health_records_count_365d: number;
  days_since_last_disease_365d: number;
}

export interface DataCompleteness {
  hasWeightData: boolean;
  hasBcsData: boolean;
  hasIotData: boolean;
  hasVaccinationData: boolean;
  hasHealthData: boolean;
  hasReproductionData: boolean;
  /** True if at least BCS or IoT data is present */
  hasMinimumData: boolean;
  /** List of missing category names */
  missingCategories: string[];
}

export interface AnimalFeaturesWithStatus extends AnimalFeatures {
  dataStatus: DataCompleteness;
}

/**
 * Fetches all required features for prediction directly from the original tables.
 * Also returns a data completeness status.
 * @param animalId The ID of the animal
 * @returns Features + dataStatus
 */
export async function getAnimalFeatures(animalId: number): Promise<AnimalFeaturesWithStatus> {
  console.log(`[Features] 🔍 Fetching features for animal ${animalId}...`);

  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  // 1. Basic animal data
  const animalResult = await db
    .select({
      breed: animals.breed,
      sex: animals.sex,
      birthDate: animals.birthDate,
    })
    .from(animals)
    .where(eq(animals.id, animalId))
    .limit(1);

  if (!animalResult || animalResult.length === 0) {
    throw new Error(`Animal ${animalId} not found`);
  }

  const animal = animalResult[0];
  const ageDays = animal.birthDate
    ? Math.floor((now.getTime() - new Date(animal.birthDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // 2. Weight records – last 30 days
  const weightRecords = await db
    .select({
      weight: animalWeightRecords.weight,
      date: animalWeightRecords.date,
    })
    .from(animalWeightRecords)
    .where(
      and(
        eq(animalWeightRecords.animalId, animalId),
        gt(animalWeightRecords.date, thirtyDaysAgo)
      )
    )
    .orderBy(desc(animalWeightRecords.date));

  const weightLast = weightRecords.length > 0 ? Number(weightRecords[0].weight) : null;
  const weightCount30d = weightRecords.length;
  const weightMean30d = weightRecords.length > 0
    ? weightRecords.reduce((s, r) => s + Number(r.weight), 0) / weightRecords.length
    : null;
  const weightChange30d = weightRecords.length >= 2
    ? Number(weightRecords[0].weight) - Number(weightRecords[weightRecords.length - 1].weight)
    : null;

  let daysSinceLastWeight = 999;
  if (weightRecords.length > 0) {
    const lastDate = new Date(weightRecords[0].date);
    daysSinceLastWeight = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 3. BCS records – last 30 days
  const bcsRecords = await db
    .select({
      bcsScore: animalBcsRecords.bcsScore,
      date: animalBcsRecords.date,
    })
    .from(animalBcsRecords)
    .where(
      and(
        eq(animalBcsRecords.animalId, animalId),
        gt(animalBcsRecords.date, thirtyDaysAgo)
      )
    )
    .orderBy(desc(animalBcsRecords.date));

  const bcsLast = bcsRecords.length > 0 ? Number(bcsRecords[0].bcsScore) : null;
  const bcsCount30d = bcsRecords.length;
  const bcsMean30d = bcsRecords.length > 0
    ? bcsRecords.reduce((s, r) => s + Number(r.bcsScore), 0) / bcsRecords.length
    : null;
  const bcsChange30d = bcsRecords.length >= 2
    ? Number(bcsRecords[0].bcsScore) - Number(bcsRecords[bcsRecords.length - 1].bcsScore)
    : null;

  let daysSinceLastBcs = 999;
  if (bcsRecords.length > 0) {
    const lastDate = new Date(bcsRecords[0].date);
    daysSinceLastBcs = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 4. IoT data – last 30 days
  const shields = await db
    .select({ id: iotShields.id })
    .from(iotShields)
    .where(
      and(
        eq(iotShields.animalId, animalId),
        eq(iotShields.status, 'ACTIVE')
      )
    );

  let hasIot = 0;
  let tempMean30d: number | null = null;
  let tempMax30d: number | null = null;
  let tempAnomalies30d: number | null = null;
  let tempLast: number | null = null;
  let restRatio30d: number | null = null;
  let movementRatio30d: number | null = null;
  let grazingRatio30d: number | null = null;
  let alertCount30d = 0;
  let daysIotData30d: number | null = null;
  let sensorDataLength = 0; // to track if we have actual IoT readings

  if (shields.length > 0) {
    hasIot = 1;
    const shieldIds = shields.map(s => s.id);

    const sensorData = await db
      .select({
        temperature: iotSensorData.temperature,
        activity: iotSensorData.activity,
        measuredAt: iotSensorData.measuredAt,
      })
      .from(iotSensorData)
      .where(
        and(
          sql`${iotSensorData.shieldId} IN (${shieldIds.join(',')})`,
          gt(iotSensorData.measuredAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(iotSensorData.measuredAt));

    sensorDataLength = sensorData.length;

    if (sensorData.length > 0) {
      const temps = sensorData
        .filter(d => d.temperature !== null)
        .map(d => Number(d.temperature));
      const activities = sensorData
        .filter(d => d.activity !== null)
        .map(d => d.activity);

      if (temps.length > 0) {
        tempMean30d = temps.reduce((a, b) => a + b, 0) / temps.length;
        tempMax30d = Math.max(...temps);
        tempLast = temps[0];
        tempAnomalies30d = temps.filter(t => t > 40.5).length;
      }

      const total = activities.length;
      if (total > 0) {
        const restCount = activities.filter(a => a === 'REST').length;
        const movementCount = activities.filter(a => a === 'MOVEMENT').length;
        const grazingCount = activities.filter(a => a === 'GRAZING').length;
        restRatio30d = restCount / total;
        movementRatio30d = movementCount / total;
        grazingRatio30d = grazingCount / total;
      }

      const distinctDays = new Set(
        sensorData.map(d => new Date(d.measuredAt).toISOString().split('T')[0])
      );
      daysIotData30d = distinctDays.size;
    }
  }

  // 5. Vaccinations
  const vaccineRecords = await db
    .select({ date: vaccinations.date })
    .from(vaccinations)
    .where(eq(vaccinations.animalId, animalId))
    .orderBy(desc(vaccinations.date));

  const vaccineCount = vaccineRecords.length;
  let daysSinceLastVaccine = 999;
  if (vaccineRecords.length > 0) {
    const lastDate = new Date(vaccineRecords[0].date);
    daysSinceLastVaccine = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // 6. Reproduction
  const reproCycles = await db
    .select({
      lambingDate: reproductionCycles.lambingDate,
      pregnancyConfirmed: reproductionCycles.pregnancyConfirmed,
    })
    .from(reproductionCycles)
    .where(eq(reproductionCycles.animalId, animalId));

  const reproCyclesCount = reproCycles.length;
  const hasLambing = reproCycles.some(r => r.lambingDate !== null) ? 1 : 0;
  const pregnanciesCount = reproCycles.filter(r => r.pregnancyConfirmed).length;

  // 7. Health records – last 365 days
  const healthRecords = await db
    .select({
      date: animalHealthRecords.date,
      category: animalHealthRecords.category,
    })
    .from(animalHealthRecords)
    .where(
      and(
        eq(animalHealthRecords.animalId, animalId),
        gt(animalHealthRecords.date, oneYearAgo)
      )
    )
    .orderBy(desc(animalHealthRecords.date));

  const healthRecordsCount365d = healthRecords.length;
  let daysSinceLastDisease365d = 999;
  const diseaseRecords = healthRecords.filter(
    r => r.category === 'ILLNESS' || r.category === 'TREATMENT'
  );
  if (diseaseRecords.length > 0) {
    const lastDate = new Date(diseaseRecords[0].date);
    daysSinceLastDisease365d = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  // ============================================================
  // 8. Assemble the feature object
  // ============================================================
  const features: AnimalFeatures = {
    breed: animal.breed,
    sex: animal.sex,
    age_days: ageDays,

    has_bcs: bcsRecords.length > 0 ? 1 : 0,
    bcs_last: bcsLast,
    bcs_mean_30d: bcsMean30d,
    bcs_count_30d: bcsCount30d,
    bcs_change_30d: bcsChange30d,
    days_since_last_bcs: daysSinceLastBcs,

    has_iot: hasIot,
    temp_mean_30d: tempMean30d,
    temp_max_30d: tempMax30d,
    temp_anomalies_30d: tempAnomalies30d,
    temp_last: tempLast,
    rest_ratio_30d: restRatio30d,
    movement_ratio_30d: movementRatio30d,
    grazing_ratio_30d: grazingRatio30d,
    alert_count_30d: alertCount30d,
    days_iot_data_30d: daysIotData30d,

    weight_last: weightLast,
    weight_mean_30d: weightMean30d,
    weight_change_30d: weightChange30d,
    weight_count_30d: weightCount30d,
    days_since_last_weight: daysSinceLastWeight,

    vaccine_count: vaccineCount,
    days_since_last_vaccine: daysSinceLastVaccine,

    repro_cycles_count: reproCyclesCount,
    has_lambing: hasLambing,
    pregnancies_count: pregnanciesCount,

    health_records_count_365d: healthRecordsCount365d,
    days_since_last_disease_365d: daysSinceLastDisease365d,
  };

  // ============================================================
  // 9. Compute data completeness status
  // ============================================================
  const hasWeightData = weightRecords.length > 0;
  const hasBcsData = bcsRecords.length > 0;
  const hasIotData = sensorDataLength > 0; // we need actual sensor readings
  const hasVaccinationData = vaccineRecords.length > 0;
  const hasHealthData = healthRecords.length > 0;
  const hasReproductionData = reproCycles.length > 0;

  // Minimum requirement: at least BCS or IoT data
  const hasMinimumData = hasBcsData || hasIotData;

  const missingCategories: string[] = [];
  if (!hasWeightData) missingCategories.push('Weight records');
  if (!hasBcsData) missingCategories.push('BCS records');
  if (!hasIotData) missingCategories.push('IoT data');
  if (!hasVaccinationData) missingCategories.push('Vaccination records');
  if (!hasHealthData) missingCategories.push('Health records');
  if (!hasReproductionData) missingCategories.push('Reproduction records');

  const dataStatus: DataCompleteness = {
    hasWeightData,
    hasBcsData,
    hasIotData,
    hasVaccinationData,
    hasHealthData,
    hasReproductionData,
    hasMinimumData,
    missingCategories,
  };

  console.log(`[Features] ✅ Features computed for animal ${animalId}. Data completeness: ${hasMinimumData ? 'Sufficient' : 'Insufficient'}`);

  return {
    ...features,
    dataStatus,
  };
}