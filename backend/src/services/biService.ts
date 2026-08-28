/**
 * backend/src/services/biService.ts
 * ------------------------------------------------------------------
 * Logique métier du Module 12 (BI Dashboard). Applique les valeurs
 * par défaut (plage de dates, exploitation), assemble les résultats
 * du repository en payloads prêts pour les widgets, et calcule les
 * indicateurs dérivés (deltas de benchmark, marge nette, etc.).
 * ------------------------------------------------------------------
 */

import * as biRepository from "../repositories/biRepository.js";
import type { DateRange } from "../repositories/biRepository.js";

export interface BiFilters {
  exploitationId?: number;
  dateFrom?: string;
  dateTo?: string;
  // ---- Filtres croisés (US-12.2) ----
  breed?: string;
  sex?: "MALE" | "FEMALE";
  healthStatus?: string;
  buildingId?: number;
  lot?: string;
  ageMin?: number;
  ageMax?: number;
  granularity?: "day" | "week" | "month" | "year";
}

/** Assemble les filtres animaux (exploitation + race + sexe + statut santé + dates + bâtiment + lot + âge) pour le repository. */
function toAnimalFilters(filters: BiFilters, range: DateRange) {
  return {
    exploitationId: filters.exploitationId,
    breed: filters.breed,
    sex: filters.sex,
    healthStatus: filters.healthStatus,
    buildingId: filters.buildingId,
    lot: filters.lot,
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    from: range.from,
    to: range.to,
  };
}

function toRange(filters: BiFilters): DateRange {
  // Par défaut : les 12 derniers mois si aucune date n'est fournie.
  const to = filters.dateTo ?? new Date().toISOString().slice(0, 10);
  const from =
    filters.dateFrom ??
    (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - 12);
      return d.toISOString().slice(0, 10);
    })();
  return { from, to };
}

// ============================================================
// 1. DASHBOARD PRINCIPAL (US-12.1)
// ============================================================

export interface DashboardOverview {
  herd: Awaited<ReturnType<typeof biRepository.getHerdOverview>>;
  mortalityRate: number;
  fertilityRate: number;
  gmqTrend: Awaited<ReturnType<typeof biRepository.getGmqTrend>>;
  bcsDistribution: Awaited<ReturnType<typeof biRepository.getBcsDistribution>>;
  activeAlerts: Awaited<ReturnType<typeof biRepository.getActiveFatteningAlerts>>;
  period: DateRange;
}

export async function getDashboardOverview(filters: BiFilters): Promise<DashboardOverview> {
  const range = toRange(filters);
  const animalFilters = toAnimalFilters(filters, range);
  const [herd, mortalityRate, fertilityRate, gmqTrend, bcsDistribution, activeAlerts] = await Promise.all([
    biRepository.getHerdOverview(animalFilters),
    biRepository.getMortalityRate(animalFilters),
    biRepository.getFertilityRate(animalFilters),
    biRepository.getGmqTrend(animalFilters, filters.granularity),
    biRepository.getBcsDistribution(animalFilters),
    biRepository.getActiveFatteningAlerts(filters.exploitationId),
  ]);

  return { herd, mortalityRate, fertilityRate, gmqTrend, bcsDistribution, activeAlerts, period: range };
}

// ============================================================
// 2. FINANCIER (US-12.1, US-12.6, Module 10)
// ============================================================

export interface FinancialSummary {
  monthly: Awaited<ReturnType<typeof biRepository.getMonthlyFinancials>>;
  costBreakdown: Awaited<ReturnType<typeof biRepository.getCostBreakdown>>;
  totalExpenses: number;
  totalRevenues: number;
  netMargin: number;
  netMarginPercent: number | null;
  period: DateRange;
}

export async function getFinancialSummary(filters: BiFilters): Promise<FinancialSummary> {
  const range = toRange(filters);
  const [monthly, costBreakdown] = await Promise.all([
    biRepository.getMonthlyFinancials(filters.exploitationId, range),
    biRepository.getCostBreakdown(filters.exploitationId, range),
  ]);

  const totalExpenses = Number(monthly.reduce((sum, m) => sum + m.totalExpenses, 0).toFixed(2));
  const totalRevenues = Number(monthly.reduce((sum, m) => sum + m.totalRevenues, 0).toFixed(2));
  const netMargin = Number((totalRevenues - totalExpenses).toFixed(2));

  return {
    monthly,
    costBreakdown,
    totalExpenses,
    totalRevenues,
    netMargin,
    netMarginPercent: totalRevenues > 0 ? Number(((netMargin / totalRevenues) * 100).toFixed(1)) : null,
    period: range,
  };
}

// ============================================================
// 3. ENGRAISSEMENT & ALIMENTATION (US-12.4, Modules 7/8)
// ============================================================

export interface FatteningSummary {
  batches: Awaited<ReturnType<typeof biRepository.getFatteningPerformance>>;
  fcr: Awaited<ReturnType<typeof biRepository.getFcr>>;
  underperformingBatches: number; // GMQ réel < 85% de la cible
}

export async function getFatteningSummary(filters: BiFilters): Promise<FatteningSummary> {
  const range = toRange(filters);
  const [batches, fcr] = await Promise.all([
    biRepository.getFatteningPerformance(filters.exploitationId),
    biRepository.getFcr(filters.exploitationId, range),
  ]);

  const underperformingBatches = batches.filter(
    (b) => b.targetGmq != null && b.actualGmqGramsPerDay != null && b.actualGmqGramsPerDay < b.targetGmq * 0.85
  ).length;

  return { batches, fcr, underperformingBatches };
}

// ============================================================
// 4. BENCHMARK MULTI-EXPLOITATIONS (US-12.3, US-12.7)
// ============================================================

export interface BenchmarkRow {
  exploitationId: number;
  exploitationName: string;
  totalAnimals: number;
  avgBcs: number | null;
  mortalityRate: number;
  fertilityRate: number;
  totalRevenues30d: number;
  isCurrentExploitation: boolean;
  deltaMortalityVsAvgPercent: number | null;
  deltaFertilityVsAvgPercent: number | null;
}

export interface BenchmarkResult {
  rows: BenchmarkRow[];
  clusterAverage: {
    mortalityRate: number;
    fertilityRate: number;
    avgBcs: number | null;
  };
}

export interface CooperativeOverview {
  totals: { exploitations: number; totalAnimals: number; totalRevenues30d: number; avgMortalityRate: number; avgFertilityRate: number; avgBcs: number | null };
  exploitations: BenchmarkRow[];
  ranking: { rank: number; label: string; score: number; mortalityRate: number; fertilityRate: number; totalAnimals: number }[];
  trends: Awaited<ReturnType<typeof biRepository.getCooperativeTrends>>;
}

/**
 * Vue benchmark. `viewerExploitationId` = l'exploitation de l'utilisateur
 * connecté (pour marquer sa ligne et calculer ses écarts vs la moyenne).
 * `isCoopManager` = true si l'utilisateur a le rôle COOPERATIVE (accès à
 * toutes les lignes) ; sinon on ne retourne que sa ligne + l'agrégat
 * (cf. confidentialité décrite en US-12.7).
 */
export async function getBenchmark(viewerExploitationId: number | undefined, isCoopManager: boolean, cooperativeUserId?: number): Promise<BenchmarkResult> {
  const cooperativeIds = isCoopManager && cooperativeUserId != null ? await biRepository.getCooperativeExploitationIds(cooperativeUserId) : undefined;
  const all = await biRepository.getExploitationsBenchmark(cooperativeIds);

  const avgMortality = average(all.map((e) => e.mortalityRate));
  const avgFertility = average(all.map((e) => e.fertilityRate));
  const bcsValues = all.map((e) => e.avgBcs).filter((v): v is number => v != null);
  const avgBcs = bcsValues.length ? average(bcsValues) : null;

  const rows: BenchmarkRow[] = all.map((e) => ({
    exploitationId: e.exploitationId,
    exploitationName: e.exploitationName,
    totalAnimals: e.totalAnimals,
    avgBcs: e.avgBcs,
    mortalityRate: e.mortalityRate,
    fertilityRate: e.fertilityRate,
    totalRevenues30d: e.totalRevenues30d,
    isCurrentExploitation: e.exploitationId === viewerExploitationId,
    deltaMortalityVsAvgPercent: avgMortality > 0 ? Number((((e.mortalityRate - avgMortality) / avgMortality) * 100).toFixed(1)) : null,
    deltaFertilityVsAvgPercent: avgFertility > 0 ? Number((((e.fertilityRate - avgFertility) / avgFertility) * 100).toFixed(1)) : null,
  }));

  const visibleRows = isCoopManager
    ? rows
    : rows.filter((r) => r.isCurrentExploitation);

  return {
    rows: visibleRows,
    clusterAverage: {
      mortalityRate: Number(avgMortality.toFixed(2)),
      fertilityRate: Number(avgFertility.toFixed(2)),
      avgBcs: avgBcs != null ? Number(avgBcs.toFixed(2)) : null,
    },
  };
}

/** Vue de pilotage privée, réservée à la coopérative propriétaire des exploitations. */
export async function getCooperativeOverview(cooperativeUserId?: number): Promise<CooperativeOverview> {
  const exploitationIds = cooperativeUserId == null ? undefined : await biRepository.getCooperativeExploitationIds(cooperativeUserId);
  const all = await biRepository.getExploitationsBenchmark(exploitationIds);
  const totalAnimals = all.reduce((sum, row) => sum + row.totalAnimals, 0);
  const weighted = (key: "mortalityRate" | "fertilityRate") => totalAnimals ? all.reduce((sum, row) => sum + row[key] * row.totalAnimals, 0) / totalAnimals : 0;
  const bcsRows = all.filter((row): row is typeof row & { avgBcs: number } => row.avgBcs != null);
  const bcsAnimals = bcsRows.reduce((sum, row) => sum + row.totalAnimals, 0);
  const avgBcs = bcsAnimals ? bcsRows.reduce((sum, row) => sum + row.avgBcs * row.totalAnimals, 0) / bcsAnimals : null;
  const avgMortality = weighted("mortalityRate"), avgFertility = weighted("fertilityRate");
  const exploitations = all.map((row) => ({ ...row, isCurrentExploitation: false, deltaMortalityVsAvgPercent: avgMortality ? Number((((row.mortalityRate - avgMortality) / avgMortality) * 100).toFixed(1)) : null, deltaFertilityVsAvgPercent: avgFertility ? Number((((row.fertilityRate - avgFertility) / avgFertility) * 100).toFixed(1)) : null }));
  const ranking = exploitations.map((row, sourceIndex) => ({ ...row, sourceIndex, score: Number((row.fertilityRate - row.mortalityRate).toFixed(1)) })).sort((a, b) => b.score - a.score).map((row, index) => ({ rank: index + 1, label: `Exploitation ${String(row.sourceIndex + 1).padStart(2, "0")}`, score: row.score, mortalityRate: row.mortalityRate, fertilityRate: row.fertilityRate, totalAnimals: row.totalAnimals }));
  return { totals: { exploitations: all.length, totalAnimals, totalRevenues30d: Number(all.reduce((sum, row) => sum + row.totalRevenues30d, 0).toFixed(2)), avgMortalityRate: Number(avgMortality.toFixed(2)), avgFertilityRate: Number(avgFertility.toFixed(2)), avgBcs: avgBcs == null ? null : Number(avgBcs.toFixed(2)) }, exploitations, ranking, trends: await biRepository.getCooperativeTrends(all.map((row) => row.exploitationId)) };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ============================================================
// 5. ALERTES (US-12.8)
// ============================================================

export async function getActiveAlerts(filters: BiFilters) {
  return biRepository.getActiveFatteningAlerts(filters.exploitationId);
}

export interface CalendarEvent {
  id: number;
  type: "lambing" | "heat" | "vaccination" | "booster";
  date: string;
  title: string;
  animalName?: string;
}

export async function getUpcomingCalendarEvents(exploitationId?: number): Promise<CalendarEvent[]> {
  return biRepository.getUpcomingCalendarEvents(exploitationId);
}
