import {
  getDailyStats,
  getOrderedReadingsWithPosition,
  getAnimalShieldsForExploitation,
} from "../repositories/iotAnalytics.repository.js";

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sinceDaysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ── Tendance de température ─────────────────────────────────────

export type TemperaturePoint = {
  day: string;
  avgTemperature: number;
  maxTemperature: number;
};

export async function getTemperatureTrend(shieldId: number, days: number) {
  const rows = await getDailyStats(shieldId, sinceDaysAgo(days));
  const points: TemperaturePoint[] = rows.map((r) => ({
    day: r.day,
    avgTemperature: Number(r.avgTemperature),
    maxTemperature: Number(r.maxTemperature),
  }));
  return { success: true as const, status: 200 as const, data: points };
}

// ── Temps de pâturage ────────────────────────────────────────────

export type GrazingPoint = {
  day: string;
  grazingPercent: number; // % des lectures en GRAZING ce jour-là
  estimatedHours: number; // approximation : % * 24h
};

/**
 * NOTE : l'estimation en heures suppose une couverture ~continue de 24h/jour
 * par le capteur. Avec des capteurs réels à fréquence variable, ce chiffre
 * reste une approximation basée sur la proportion de lectures GRAZING.
 */
export async function getGrazingTime(shieldId: number, days: number) {
  const rows = await getDailyStats(shieldId, sinceDaysAgo(days));
  const points: GrazingPoint[] = rows.map((r) => {
    const total = Number(r.totalCount) || 1;
    const grazing = Number(r.grazingCount) || 0;
    const percent = (grazing / total) * 100;
    return {
      day: r.day,
      grazingPercent: Math.round(percent * 10) / 10,
      estimatedHours: Math.round((percent / 100) * 24 * 10) / 10,
    };
  });
  return { success: true as const, status: 200 as const, data: points };
}

// ── Distance parcourue ───────────────────────────────────────────

export type DistancePoint = { day: string; distanceKm: number };

export async function getDistanceTraveled(shieldId: number, days: number) {
  const readings = await getOrderedReadingsWithPosition(shieldId, sinceDaysAgo(days));

  const perDay = new Map<string, number>();
  let totalKm = 0;

  for (let i = 1; i < readings.length; i++) {
    const prev = readings[i - 1];
    const curr = readings[i];
    if (!prev.latitude || !prev.longitude || !curr.latitude || !curr.longitude) continue;

    const dist = haversineDistanceKm(
      parseFloat(prev.latitude),
      parseFloat(prev.longitude),
      parseFloat(curr.latitude),
      parseFloat(curr.longitude)
    );

    const day = new Date(curr.measuredAt).toISOString().slice(0, 10);
    perDay.set(day, (perDay.get(day) ?? 0) + dist);
    totalKm += dist;
  }

  const points: DistancePoint[] = Array.from(perDay.entries())
    .map(([day, distanceKm]) => ({ day, distanceKm: Math.round(distanceKm * 100) / 100 }))
    .sort((a, b) => a.day.localeCompare(b.day));

  return {
    success: true as const,
    status: 200 as const,
    data: points,
    totalKm: Math.round(totalKm * 100) / 100,
  };
}

// ── Comparaison inter-animaux ────────────────────────────────────

export type AnimalComparison = {
  shieldId: number;
  animalId: number;
  animalName: string;
  animalRfid: string;
  avgTemperature: number | null;
  grazingPercent: number | null;
  distanceKm: number;
};

export async function compareAnimals(exploitationId: number, days: number) {
  const shields = await getAnimalShieldsForExploitation(exploitationId);

  const results: AnimalComparison[] = [];
  for (const s of shields) {
    const dailyStats = await getDailyStats(s.shieldId, sinceDaysAgo(days));
    const readings = await getOrderedReadingsWithPosition(s.shieldId, sinceDaysAgo(days));

    let avgTemp: number | null = null;
    let grazingPercent: number | null = null;
    if (dailyStats.length > 0) {
      const totalGrazing = dailyStats.reduce((sum, r) => sum + Number(r.grazingCount), 0);
      const totalCount = dailyStats.reduce((sum, r) => sum + Number(r.totalCount), 0);
      const tempSum = dailyStats.reduce((sum, r) => sum + Number(r.avgTemperature), 0);
      avgTemp = Math.round((tempSum / dailyStats.length) * 10) / 10;
      grazingPercent = totalCount > 0 ? Math.round((totalGrazing / totalCount) * 1000) / 10 : 0;
    }

    let distanceKm = 0;
    for (let i = 1; i < readings.length; i++) {
      const prev = readings[i - 1];
      const curr = readings[i];
      if (!prev.latitude || !prev.longitude || !curr.latitude || !curr.longitude) continue;
      distanceKm += haversineDistanceKm(
        parseFloat(prev.latitude),
        parseFloat(prev.longitude),
        parseFloat(curr.latitude),
        parseFloat(curr.longitude)
      );
    }

    results.push({
      shieldId: s.shieldId,
      animalId: s.animalId,
      animalName: s.animalName,
      animalRfid: s.animalRfid,
      avgTemperature: avgTemp,
      grazingPercent,
      distanceKm: Math.round(distanceKm * 100) / 100,
    });
  }

  return { success: true as const, status: 200 as const, data: results };
}