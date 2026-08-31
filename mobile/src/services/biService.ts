/**
 * mobile/src/services/biService.ts
 * ------------------------------------------------------------------
 * Couche d'accès à l'API pour le Module 12 (BI Dashboard), côté mobile.
 * Suit le même pattern que tes autres services (`animalsService`,
 * `healthService`...) : utilise le client Axios commun, qui gère déjà
 * le JWT et le refresh token automatiquement.
 *
 * ⚠️ À ADAPTER :
 *   L'import ci-dessous suppose que `api.ts` exporte l'instance Axios
 *   par défaut (`export default api;`). Si chez toi c'est un export
 *   nommé (`export const api = ...`), remplace la ligne d'import par :
 *     import { api } from "./api";
 * ------------------------------------------------------------------
 */

import api from "./api";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { getAccessToken } from "@/utils/auth";

// ============================================================
// TYPES — reflètent exactement les payloads renvoyés par
// backend/src/services/biService.ts (voir DashboardOverview,
// FinancialSummary, FatteningSummary, BenchmarkResult).
// ============================================================

export interface BiFilters {
  exploitationId?: number;
  dateFrom?: string; // 'YYYY-MM-DD'
  dateTo?: string; // 'YYYY-MM-DD'
  breed?: "Sardi" | "Timahdite" | "D'man" | "Beni-Guil";
  sex?: "MALE" | "FEMALE";
  healthStatus?: "HEALTHY" | "SICK" | "RECOVERING" | "QUARANTINE";
  buildingId?: number;
  lot?: string;
  ageMin?: number;
  ageMax?: number;
  granularity?: "day" | "week" | "month" | "year";
}

export interface HerdOverview {
  totalAnimals: number;
  males: number;
  females: number;
  avgBcs: number | null;
  breedDistribution: { breed: string; count: number }[];
  healthDistribution: { status: string; count: number }[];
}

export interface GmqPoint {
  month: string;
  avgWeight: number;
  gmqGramsPerDay: number | null;
}

export interface BcsDistributionBucket {
  range: string;
  count: number;
}

export interface ActiveAlert {
  id: number;
  batchName: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: number;
  type: "lambing" | "heat" | "vaccination" | "booster";
  date: string;
  title: string;
  animalName?: string;
}

export interface DashboardOverview {
  herd: HerdOverview;
  mortalityRate: number;
  fertilityRate: number;
  gmqTrend: GmqPoint[];
  bcsDistribution: BcsDistributionBucket[];
  activeAlerts: ActiveAlert[];
  period: { from?: string; to?: string };
}

export interface MonthlyFinancials {
  month: string;
  totalExpenses: number;
  totalRevenues: number;
  netCashflow: number;
}

export interface CostBreakdown {
  category: string;
  total: number;
}

export interface FinancialSummary {
  monthly: MonthlyFinancials[];
  costBreakdown: CostBreakdown[];
  totalExpenses: number;
  totalRevenues: number;
  netMargin: number;
  netMarginPercent: number | null;
  period: { from?: string; to?: string };
}

export interface FatteningBatchPerformance {
  batchId: number;
  name: string;
  status: string;
  targetGmq: number | null;
  actualGmqGramsPerDay: number | null;
  totalCost: number;
  costPerKgGain: number | null;
}

export interface FatteningSummary {
  batches: FatteningBatchPerformance[];
  fcr: { totalFeedKg: number; totalWeightGainKg: number; fcr: number | null };
  underperformingBatches: number;
}

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
  clusterAverage: { mortalityRate: number; fertilityRate: number; avgBcs: number | null };
}

// ============================================================
// APPELS API
// ============================================================

function toParams(filters: BiFilters = {}) {
  const params: Record<string, string | number> = {};
  if (filters.exploitationId != null) params.exploitationId = filters.exploitationId;
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  if (filters.breed) params.breed = filters.breed;
  if (filters.sex) params.sex = filters.sex;
  if (filters.healthStatus) params.healthStatus = filters.healthStatus;
  if (filters.buildingId != null) params.buildingId = filters.buildingId;
  if (filters.lot) params.lot = filters.lot;
  if (filters.ageMin != null) params.ageMin = filters.ageMin;
  if (filters.ageMax != null) params.ageMax = filters.ageMax;
  if (filters.granularity) params.granularity = filters.granularity;
  return params;
}

export interface CooperativeOverview {
  totals: { exploitations: number; totalAnimals: number; totalRevenues30d: number; avgMortalityRate: number; avgFertilityRate: number; avgBcs: number | null };
  exploitations: BenchmarkRow[];
  ranking: { rank: number; label: string; score: number; mortalityRate: number; fertilityRate: number; totalAnimals: number }[];
  trends: { period: string; avgWeight: number | null; animalCount: number }[];
}

export type BiExportFormat = "pdf" | "csv" | "xlsx" | "png" | "pptx";

/** Télécharge puis partage le rapport BI généré par le serveur. */
export async function exportBiReport(format: BiExportFormat, filters: BiFilters = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Session expirée. Veuillez vous reconnecter.");
  const params = new URLSearchParams(Object.entries(toParams(filters)).map(([key, value]) => [key, String(value)]));
  const url = `${api.defaults.baseURL}/bi/export/${format}?${params.toString()}`;
  const filename = `rapport-bi-${new Date().toISOString().slice(0, 10)}.${format}`;
  if (Platform.OS === "web") {
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Export impossible (HTTP ${response.status}).`);
    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
    return;
  }
  const destination = `${FileSystem.documentDirectory}${filename}`;
  const result = await FileSystem.downloadAsync(url, destination, { headers: { Authorization: `Bearer ${token}` } });
  if (result.status !== 200) throw new Error(`Export impossible (HTTP ${result.status}).`);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { mimeType: mimeTypeFor(format) });
}

function mimeTypeFor(format: BiExportFormat) {
  return ({ pdf: "application/pdf", csv: "text/csv", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", png: "image/png", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation" } as const)[format];
}

export async function fetchDashboard(filters: BiFilters = {}): Promise<DashboardOverview> {
  const res = await api.get<{ data: DashboardOverview }>("/bi/dashboard", { params: toParams(filters) });
  return res.data.data;
}

export async function fetchFinancials(filters: BiFilters = {}): Promise<FinancialSummary> {
  const res = await api.get<{ data: FinancialSummary }>("/bi/financials", { params: toParams(filters) });
  return res.data.data;
}

export async function fetchFattening(filters: BiFilters = {}): Promise<FatteningSummary> {
  const res = await api.get<{ data: FatteningSummary }>("/bi/fattening", { params: toParams(filters) });
  return res.data.data;
}

export async function fetchBenchmark(): Promise<BenchmarkResult> {
  const res = await api.get<{ data: BenchmarkResult }>("/bi/benchmark");
  return res.data.data;
}

export async function fetchCooperativeOverview(): Promise<CooperativeOverview> {
  const res = await api.get<{ data: CooperativeOverview }>("/bi/cooperative-overview");
  return res.data.data;
}

export async function fetchAlerts(filters: BiFilters = {}): Promise<ActiveAlert[]> {
  const res = await api.get<{ data: ActiveAlert[] }>("/bi/alerts", { params: toParams(filters) });
  return res.data.data;
}

export async function fetchCalendarEvents(filters: BiFilters = {}): Promise<CalendarEvent[]> {
  const res = await api.get<{ data: CalendarEvent[] }>("/bi/calendar-events", { params: toParams(filters) });
  return res.data.data;
}

// ============================================================
// Regroupement par défaut (pratique pour `import biService from "./biService"`)
// ============================================================

const biService = {
  fetchDashboard,
  fetchFinancials,
  fetchFattening,
  fetchBenchmark,
  fetchCooperativeOverview,
  fetchAlerts,
  fetchCalendarEvents,
  exportBiReport,
};

export default biService;
