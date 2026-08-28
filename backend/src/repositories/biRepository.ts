/**
 * backend/src/repositories/biRepository.ts
 * ------------------------------------------------------------------
 * Couche d'accès aux données pour le Module 12 (BI Dashboard).
 * Respecte l'architecture Route → Controller → Service → Repository → Drizzle → MySQL.
 *
 * ⚠️ IMPORTANT — À ADAPTER :
 *   L'import `db` ci-dessous pointe vers un chemin générique. Remplace-le
 *   par ton client Drizzle réel, ex :
 *     import { db } from "../db/client";
 *   Le reste du fichier n'a besoin de rien d'autre que `db.execute(sql\`...\`)`,
 *   donc il fonctionne quel que soit le nom de tes fichiers schema.ts —
 *   on interroge les tables directement par leur nom SQL (identique à ssm.sql).
 *
 * Toutes les fonctions sont en lecture seule (SELECT) et acceptent des
 * filtres optionnels (exploitationId, plage de dates) cohérents avec
 * les US-12.1 (widgets), US-12.2 (filtres croisés), US-12.3 (benchmark),
 * US-12.4 (corrélations) et US-12.6 (financier).
 * ------------------------------------------------------------------
 */

import { sql } from "drizzle-orm";
import { db } from "../db/connection.js"; // <-- adapte ce chemin à ton projet

export interface DateRange {
  from?: string; // 'YYYY-MM-DD'
  to?: string; // 'YYYY-MM-DD'
}

function dateFilter(column: string, range?: DateRange) {
  const clauses = [];
  if (range?.from) clauses.push(sql`${sql.raw(column)} >= ${range.from}`);
  if (range?.to) clauses.push(sql`${sql.raw(column)} <= ${range.to}`);
  return clauses;
}

function combineAnd(base: ReturnType<typeof sql>, extra: ReturnType<typeof sql>[]) {
  return extra.reduce((acc, clause) => sql`${acc} AND ${clause}`, base);
}

// ============================================================
// FILTRES CROISÉS SUR LE TROUPEAU (US-12.2)
// ------------------------------------------------------------
// La table `animals` dispose désormais des colonnes `batiment_id`
// et `lot`, permettant de filtrer par bâtiment/parcelle et par lot.
// Les filtres disponibles : exploitation, race, sexe, statut santé,
// bâtiment, lot, âge, plage de dates.
// ============================================================

export interface AnimalFilters extends DateRange {
  exploitationId?: number;
  breed?: string; // 'Sardi' | 'Timahdite' | "D'man" | 'Beni-Guil'
  sex?: "MALE" | "FEMALE";
  healthStatus?: string; // 'HEALTHY' | 'SICK' | 'RECOVERING' | 'QUARANTINE'
  buildingId?: number;
  lot?: string;
  ageMin?: number;
  ageMax?: number;
}

/**
 * Construit les clauses `AND ...` communes à toutes les requêtes sur les
 * animaux, à partir des filtres croisés fournis. `alias` = alias SQL de
 * la table animals dans la requête appelante (ex: 'a' si jointure, '' si direct).
 */
function animalFilterClauses(filters: AnimalFilters, alias = "") {
  const col = (name: string) => sql.raw(alias ? `${alias}.${name}` : name);
  const clauses: ReturnType<typeof sql>[] = [];
  if (filters.exploitationId) clauses.push(sql`${col("exploitation_id")} = ${filters.exploitationId}`);
  if (filters.breed) clauses.push(sql`${col("breed")} = ${filters.breed}`);
  if (filters.sex) clauses.push(sql`${col("sex")} = ${filters.sex}`);
  if (filters.healthStatus) clauses.push(sql`${col("health_status")} = ${filters.healthStatus}`);
  if (filters.buildingId) clauses.push(sql`${col("batiment_id")} = ${filters.buildingId}`);
  if (filters.lot) clauses.push(sql`${col("lot")} = ${filters.lot}`);
  if (filters.ageMin != null) clauses.push(sql`${col("birth_date")} <= DATE_SUB(CURDATE(), INTERVAL ${filters.ageMin} YEAR)`);
  if (filters.ageMax != null) clauses.push(sql`${col("birth_date")} >= DATE_SUB(CURDATE(), INTERVAL ${filters.ageMax + 1} YEAR)`);
  return clauses;
}

// ============================================================
// 1. VUE D'ENSEMBLE DU TROUPEAU (US-12.1, US-12.2)
// ============================================================

export interface HerdOverview {
  totalAnimals: number;
  males: number;
  females: number;
  breedDistribution: { breed: string; count: number }[];
  avgBcs: number | null;
  healthDistribution: { status: string; count: number }[];
}

export async function getHerdOverview(filters: AnimalFilters = {}): Promise<HerdOverview> {
  const where = combineAnd(sql`WHERE health_status != 'DECEASED'`, animalFilterClauses(filters));

  const [totalsResult] = await db.execute(sql`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN sex = 'MALE' THEN 1 ELSE 0 END) AS males,
      SUM(CASE WHEN sex = 'FEMALE' THEN 1 ELSE 0 END) AS females,
      AVG(bcs) AS avg_bcs
    FROM animals
    ${where}
  `);
  const totals = (totalsResult as unknown as any[])[0];

  const [breedResult] = await db.execute(sql`
    SELECT breed, COUNT(*) AS count
    FROM animals
    ${where}
    GROUP BY breed
    ORDER BY count DESC
  `);

  const [healthResult] = await db.execute(sql`
    SELECT health_status AS status, COUNT(*) AS count
    FROM animals
    ${where}
    GROUP BY health_status
  `);

  return {
    totalAnimals: Number(totals?.total ?? 0),
    males: Number(totals?.males ?? 0),
    females: Number(totals?.females ?? 0),
    avgBcs: totals?.avg_bcs != null ? Number(totals.avg_bcs) : null,
    breedDistribution: (breedResult as unknown as any[]).map((r) => ({ breed: r.breed, count: Number(r.count) })),
    healthDistribution: (healthResult as unknown as any[]).map((r) => ({ status: r.status, count: Number(r.count) })),
  };
}

// ============================================================
// 2. MORTALITÉ ET FERTILITÉ (US-12.1)
// ============================================================

export async function getMortalityRate(filters: AnimalFilters = {}): Promise<number> {
  const animalClauses = animalFilterClauses(filters, "a");
  const animalWhereClause = animalClauses.length
    ? animalClauses.reduce((acc, c) => sql`${acc} AND ${c}`, sql``)
    : sql``;
  const dateClauses = dateFilter("m.date", filters);
  const dateClause = dateClauses.length ? dateClauses.reduce((acc, c) => sql`${acc} AND ${c}`, sql``) : sql``;

  const [result] = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM animal_movements m
        JOIN animals a ON a.id = m.animal_id
        WHERE m.type = 'DEATH' ${animalWhereClause} ${dateClause}) AS deaths,
      (SELECT COUNT(*) FROM animals a WHERE 1=1 ${animalWhereClause}) AS total
  `);
  const row = (result as unknown as any[])[0];
  const total = Number(row?.total ?? 0);
  const deaths = Number(row?.deaths ?? 0);
  return total > 0 ? Number(((deaths / total) * 100).toFixed(2)) : 0;
}

export async function getFertilityRate(filters: AnimalFilters = {}): Promise<number> {
  const animalClauses = animalFilterClauses(filters, "a");
  const animalWhereClause = animalClauses.length
    ? animalClauses.reduce((acc, c) => sql`${acc} AND ${c}`, sql``)
    : sql``;
  const dateClauses = dateFilter("r.date", filters);
  const dateClause = dateClauses.length ? dateClauses.reduce((acc, c) => sql`${acc} AND ${c}`, sql``) : sql``;

  const [result] = await db.execute(sql`
    SELECT
      SUM(CASE WHEN r.event_type = 'BREEDING' THEN 1 ELSE 0 END) AS breedings,
      SUM(CASE WHEN r.event_type = 'BIRTH' THEN 1 ELSE 0 END) AS births
    FROM animal_reproduction_records r
    JOIN animals a ON a.id = r.animal_id
    WHERE 1=1 ${animalWhereClause} ${dateClause}
  `);
  const row = (result as unknown as any[])[0];
  const breedings = Number(row?.breedings ?? 0);
  const births = Number(row?.births ?? 0);
  return breedings > 0 ? Number(((births / breedings) * 100).toFixed(2)) : 0;
}

// ============================================================
// 3. GMQ ET COURBES DE CROISSANCE (US-12.1, US-12.4)
// ============================================================

export interface GmqPoint {
  month: string; // 'YYYY-MM' or other granularity label
  avgWeight: number;
  gmqGramsPerDay: number | null;
}

/**
 * Série du poids moyen et du GMQ (g/jour) calculé entre deux
 * points consécutifs, pour tout le troupeau (ou une exploitation donnée).
 */
export async function getGmqTrend(filters: AnimalFilters = {}, granularity: "day" | "week" | "month" | "year" = "month"): Promise<GmqPoint[]> {
  const animalClauses = animalFilterClauses(filters, "a");
  const animalWhereClause = animalClauses.length
    ? animalClauses.reduce((acc, c) => sql`${acc} AND ${c}`, sql``)
    : sql``;
  const dateClauses = dateFilter("w.date", filters);
  const dateClause = dateClauses.length ? dateClauses.reduce((acc, c) => sql`${acc} AND ${c}`, sql``) : sql``;

  let dateLabel: ReturnType<typeof sql>;
  switch (granularity) {
    case "day":
      dateLabel = sql`DATE_FORMAT(w.date, '%Y-%m-%d')`;
      break;
    case "week":
      dateLabel = sql`DATE_FORMAT(w.date, '%Y-%u')`;
      break;
    case "year":
      dateLabel = sql`DATE_FORMAT(w.date, '%Y')`;
      break;
    case "month":
    default:
      dateLabel = sql`DATE_FORMAT(w.date, '%Y-%m')`;
      break;
  }

  const [result] = await db.execute(sql`
    SELECT
      ${dateLabel} AS month,
      AVG(w.weight) AS avg_weight
    FROM animal_weight_records w
    JOIN animals a ON a.id = w.animal_id
    WHERE 1=1 ${animalWhereClause} ${dateClause}
    GROUP BY month
    ORDER BY month ASC
  `);

  const rows = (result as unknown as any[]).map((r) => ({ month: r.month as string, avgWeight: Number(r.avg_weight) }));

  return rows.map((point, i) => {
    if (i === 0) return { ...point, gmqGramsPerDay: null };
    const prev = rows[i - 1];
    const gainKg = point.avgWeight - prev.avgWeight;
    // approx 30 jours entre deux points mensuels, 7 pour hebdomadaire, 1 pour journalier, 365 pour annuel
    const days = granularity === "day" ? 1 : granularity === "week" ? 7 : granularity === "year" ? 365 : 30;
    const gmq = Number(((gainKg * 1000) / days).toFixed(1));
    return { ...point, gmqGramsPerDay: gmq };
  });
}

export interface BcsDistributionBucket {
  range: string; // e.g. '1.0-1.9'
  count: number;
}

export async function getBcsDistribution(filters: AnimalFilters = {}): Promise<BcsDistributionBucket[]> {
  const animalClauses = animalFilterClauses(filters);
  const animalWhereClause = animalClauses.length
    ? animalClauses.reduce((acc, c) => sql`${acc} AND ${c}`, sql``)
    : sql``;
  const [result] = await db.execute(sql`
    SELECT
      CASE
        WHEN bcs < 2.0 THEN '1.0-1.9'
        WHEN bcs < 3.0 THEN '2.0-2.9'
        WHEN bcs < 4.0 THEN '3.0-3.9'
        ELSE '4.0-5.0'
      END AS bucket,
      COUNT(*) AS count
    FROM animals
    WHERE health_status != 'DECEASED' AND bcs IS NOT NULL ${animalWhereClause}
    GROUP BY bucket
    ORDER BY bucket ASC
  `);
  return (result as unknown as any[]).map((r) => ({ range: r.bucket, count: Number(r.count) }));
}

// ============================================================
// 4. ALIMENTATION — FCR (US-12.4, lié au Module 7)
// ============================================================

export interface FcrResult {
  totalFeedKg: number;
  totalWeightGainKg: number;
  fcr: number | null; // kg aliment / kg de gain
}

/**
 * FCR global calculé à partir des lots d'engraissement (données les plus
 * fiables pour ce ratio, cf. US-7.4 et US-8.2 du Module 7/8).
 */
export async function getFcr(exploitationId?: number, range?: DateRange): Promise<FcrResult> {
  const expClause = exploitationId ? sql`AND fb.exploitation_id = ${exploitationId}` : sql``;
  const dateClauses = dateFilter("ffr.date", range);
  const dateClause = dateClauses.length ? combineAnd(sql`AND 1=1`, dateClauses) : sql``;

  const [feedResult] = await db.execute(sql`
    SELECT COALESCE(SUM(ffr.quantity_kg), 0) AS total_feed
    FROM fattening_feed_records ffr
    JOIN fattening_batches fb ON fb.id = ffr.fattening_batch_id
    WHERE 1=1 ${expClause} ${dateClause}
  `);

  const [weightResult] = await db.execute(sql`
    SELECT COALESCE(SUM((fb.target_weight - fb.initial_average_weight) * fb.animal_count), 0) AS total_gain
    FROM fattening_batches fb
    WHERE 1=1 ${exploitationId ? sql`AND fb.exploitation_id = ${exploitationId}` : sql``}
  `);

  const totalFeed = Number((feedResult as unknown as any[])[0]?.total_feed ?? 0);
  const totalGain = Number((weightResult as unknown as any[])[0]?.total_gain ?? 0);

  return {
    totalFeedKg: totalFeed,
    totalWeightGainKg: totalGain,
    fcr: totalGain > 0 ? Number((totalFeed / totalGain).toFixed(2)) : null,
  };
}

// ============================================================
// 5. ENGRAISSEMENT — PERFORMANCE PAR LOT (US-12.4, US-8.4)
// ============================================================

export interface FatteningBatchPerformance {
  batchId: number;
  name: string;
  status: string;
  targetGmq: number | null;
  actualGmqGramsPerDay: number | null;
  totalCost: number;
  costPerKgGain: number | null;
}

export async function getFatteningPerformance(exploitationId?: number): Promise<FatteningBatchPerformance[]> {
  const expClause = exploitationId ? sql`WHERE fb.exploitation_id = ${exploitationId}` : sql``;

  const [batches] = await db.execute(sql`
    SELECT
      fb.id, fb.name, fb.status, fb.target_daily_gmq,
      fb.initial_average_weight, fb.target_weight, fb.animal_count,
      fb.start_date, fb.estimated_end_date,
      DATEDIFF(COALESCE(fb.estimated_end_date, CURDATE()), fb.start_date) AS days
    FROM fattening_batches fb
    ${expClause}
  `);

  const results: FatteningBatchPerformance[] = [];
  for (const b of batches as unknown as any[]) {
    const gainPerAnimal = Number(b.target_weight) - Number(b.initial_average_weight);
    const days = Number(b.days) || 1;
    const actualGmq = Number(((gainPerAnimal * 1000) / days).toFixed(1));

    const [costResult] = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) AS total_cost
      FROM fattening_batch_costs WHERE fattening_batch_id = ${b.id}
    `);
    const [feedCostResult] = await db.execute(sql`
      SELECT COALESCE(SUM(total_cost), 0) AS total_feed_cost
      FROM fattening_feed_records WHERE fattening_batch_id = ${b.id}
    `);
    const totalCost =
      Number((costResult as unknown as any[])[0]?.total_cost ?? 0) + Number((feedCostResult as unknown as any[])[0]?.total_feed_cost ?? 0);
    const totalGainKg = gainPerAnimal * Number(b.animal_count);

    results.push({
      batchId: b.id,
      name: b.name,
      status: b.status,
      targetGmq: b.target_daily_gmq != null ? Number(b.target_daily_gmq) * 1000 : null, // en g/jour
      actualGmqGramsPerDay: actualGmq,
      totalCost: Number(totalCost.toFixed(2)),
      costPerKgGain: totalGainKg > 0 ? Number((totalCost / totalGainKg).toFixed(2)) : null,
    });
  }
  return results;
}

// ============================================================
// 6. FINANCIER — CASHFLOW, MARGE, RÉPARTITION DES COÛTS (US-12.1, US-12.6, Module 10)
// ============================================================

export interface MonthlyFinancials {
  month: string;
  totalExpenses: number;
  totalRevenues: number;
  netCashflow: number;
}

export async function getMonthlyFinancials(exploitationId?: number, range?: DateRange): Promise<MonthlyFinancials[]> {
  const expClauseE = exploitationId ? sql`AND exploitation_id = ${exploitationId}` : sql``;
  const expClauseR = exploitationId ? sql`AND exploitation_id = ${exploitationId}` : sql``;
  const dateClausesE = dateFilter("date", range);
  const dateClauseE = dateClausesE.length ? combineAnd(sql`AND 1=1`, dateClausesE) : sql``;

  const [expenseRows] = await db.execute(sql`
    SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(amount) AS total
    FROM expenses
    WHERE 1=1 ${expClauseE} ${dateClauseE}
    GROUP BY month
  `);
  const [revenueRows] = await db.execute(sql`
    SELECT DATE_FORMAT(date, '%Y-%m') AS month, SUM(total_ttc) AS total
    FROM revenues
    WHERE 1=1 ${expClauseR} ${dateClauseE}
    GROUP BY month
  `);

  const expenseMap = new Map<string, number>((expenseRows as unknown as any[]).map((r) => [r.month, Number(r.total)]));
  const revenueMap = new Map<string, number>((revenueRows as unknown as any[]).map((r) => [r.month, Number(r.total)]));
  const months = Array.from(new Set([...expenseMap.keys(), ...revenueMap.keys()])).sort();

  return months.map((month) => {
    const totalExpenses = expenseMap.get(month) ?? 0;
    const totalRevenues = revenueMap.get(month) ?? 0;
    return {
      month,
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalRevenues: Number(totalRevenues.toFixed(2)),
      netCashflow: Number((totalRevenues - totalExpenses).toFixed(2)),
    };
  });
}

export interface CostBreakdown {
  category: string;
  total: number;
}

export async function getCostBreakdown(exploitationId?: number, range?: DateRange): Promise<CostBreakdown[]> {
  const expClause = exploitationId ? sql`AND exploitation_id = ${exploitationId}` : sql``;
  const dateClauses = dateFilter("date", range);
  const dateClause = dateClauses.length ? combineAnd(sql`AND 1=1`, dateClauses) : sql``;

  const [result] = await db.execute(sql`
    SELECT category, SUM(amount) AS total
    FROM expenses
    WHERE 1=1 ${expClause} ${dateClause}
    GROUP BY category
    ORDER BY total DESC
  `);
  return (result as unknown as any[]).map((r) => ({ category: r.category, total: Number(r.total) }));
}

// ============================================================
// 7. BENCHMARK MULTI-EXPLOITATIONS (US-12.3, US-12.7)
// ============================================================

export interface ExploitationBenchmark {
  exploitationId: number;
  exploitationName: string;
  totalAnimals: number;
  avgBcs: number | null;
  mortalityRate: number;
  fertilityRate: number;
  totalRevenues30d: number;
}

/**
 * Comparatif de toutes les exploitations sur les KPIs clés — utilisé pour
 * le benchmark (US-12.3) et la vue coopérative agrégée (US-12.7).
 * En vue "adhérent", filtre le tableau retourné côté service/controller
 * selon les droits de l'utilisateur (chaque adhérent ne doit voir que sa ligne + l'agrégat).
 */
export async function getExploitationsBenchmark(exploitationIds?: number[]): Promise<ExploitationBenchmark[]> {
  if (exploitationIds && exploitationIds.length === 0) return [];
  const idsClause = exploitationIds?.length
    ? sql`WHERE id IN (${sql.join(exploitationIds.map((id) => sql`${id}`), sql`, `)})`
    : sql``;
  const [exploitations] = await db.execute(sql`SELECT id, name FROM exploitations ${idsClause}`);

  const results: ExploitationBenchmark[] = [];
  for (const exp of exploitations as unknown as any[]) {
    const overview = await getHerdOverview({ exploitationId: exp.id });
    const mortalityRate = await getMortalityRate({ exploitationId: exp.id });
    const fertilityRate = await getFertilityRate({ exploitationId: exp.id });

    const [revResult] = await db.execute(sql`
      SELECT COALESCE(SUM(total_ttc), 0) AS total
      FROM revenues
      WHERE exploitation_id = ${exp.id} AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    results.push({
      exploitationId: exp.id,
      exploitationName: exp.name,
      totalAnimals: overview.totalAnimals,
      avgBcs: overview.avgBcs,
      mortalityRate,
      fertilityRate,
      totalRevenues30d: Number((revResult as unknown as any[])[0]?.total ?? 0),
    });
  }
  return results;
}

/** Exploitations pilotées par une coopérative (propriétaire de l'exploitation). */
export async function getCooperativeExploitationIds(cooperativeUserId: number): Promise<number[]> {
  const [rows] = await db.execute(sql`SELECT id FROM exploitations WHERE owner_id = ${cooperativeUserId}`);
  return (rows as unknown as any[]).map((row) => Number(row.id));
}

export interface GroupTrendPoint { period: string; avgWeight: number | null; animalCount: number; }

/** Série commune au groupement, sans exposer aucune donnée animale nominative. */
export async function getCooperativeTrends(exploitationIds: number[]): Promise<GroupTrendPoint[]> {
  if (!exploitationIds.length) return [];
  const ids = sql.join(exploitationIds.map((id) => sql`${id}`), sql`, `);
  const [rows] = await db.execute(sql`
    SELECT DATE_FORMAT(w.date, '%Y-%m') AS period, AVG(w.weight) AS avg_weight, COUNT(DISTINCT a.id) AS animal_count
    FROM animal_weight_records w
    JOIN animals a ON a.id = w.animal_id
    WHERE a.exploitation_id IN (${ids})
    GROUP BY period
    ORDER BY period ASC
  `);
  return (rows as unknown as any[]).map((row) => ({ period: String(row.period), avgWeight: row.avg_weight == null ? null : Number(row.avg_weight), animalCount: Number(row.animal_count) }));
}

// ============================================================
// 8. ALERTES ACTIVES (US-12.8, lié au Module 8)
// ============================================================

export interface ActiveAlert {
  id: number;
  batchName: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
}

export async function getActiveFatteningAlerts(exploitationId?: number): Promise<ActiveAlert[]> {
  const expClause = exploitationId ? sql`AND fa.exploitation_id = ${exploitationId}` : sql``;
  const [result] = await db.execute(sql`
    SELECT fa.id, fb.name AS batch_name, fa.type, fa.severity, fa.message, fa.created_at
    FROM fattening_alerts fa
    JOIN fattening_batches fb ON fb.id = fa.fattening_batch_id
    WHERE fa.resolved = 0 ${expClause}
    ORDER BY fa.created_at DESC
  `);
  return (result as unknown as any[]).map((r) => ({
    id: r.id,
    batchName: r.batch_name,
    type: r.type,
    severity: r.severity,
    message: r.message,
    createdAt: r.created_at,
  }));
}

export interface CalendarEvent {
  id: number;
  type: "lambing" | "heat" | "vaccination" | "booster";
  date: string;
  title: string;
  animalName?: string;
}

export async function getUpcomingCalendarEvents(exploitationId?: number): Promise<CalendarEvent[]> {
  const expClause = exploitationId ? sql`AND a.exploitation_id = ${exploitationId}` : sql``;

  const [result] = await db.execute(sql`
    SELECT id, type, date, title, animal_name FROM (
      SELECT 
        rc.id,
        'lambing' AS type,
        DATE_FORMAT(rc.expected_lambing_date, '%Y-%m-%d') AS date,
        CONCAT('Mise bas prévue - ', a.name) AS title,
        a.name AS animal_name
      FROM reproduction_cycles rc
      JOIN animals a ON a.id = rc.animal_id
      WHERE rc.expected_lambing_date IS NOT NULL 
        AND rc.expected_lambing_date >= CURDATE()
        AND rc.pregnancy_confirmed = 1
        ${expClause}

      UNION ALL

      SELECT 
        rc.id,
        'heat' AS type,
        DATE_FORMAT(rc.heat_date, '%Y-%m-%d') AS date,
        CONCAT('Réchauffement - ', a.name) AS title,
        a.name AS animal_name
      FROM reproduction_cycles rc
      JOIN animals a ON a.id = rc.animal_id
      WHERE rc.heat_date >= CURDATE()
        AND rc.pregnancy_confirmed = 0
        ${expClause}

      UNION ALL

      SELECT 
        v.id,
        'vaccination' AS type,
        DATE_FORMAT(v.date, '%Y-%m-%d') AS date,
        CONCAT('Vaccination - ', a.name, ' (', v.vaccine_type, ')') AS title,
        a.name AS animal_name
      FROM vaccinations v
      JOIN animals a ON a.id = v.animal_id
      WHERE v.date >= CURDATE()
        AND v.status = 'PENDING'
        ${expClause}

      UNION ALL

      SELECT 
        v.id,
        'booster' AS type,
        DATE_FORMAT(v.booster_date, '%Y-%m-%d') AS date,
        CONCAT('Rappel - ', a.name, ' (', v.vaccine_type, ')') AS title,
        a.name AS animal_name
      FROM vaccinations v
      JOIN animals a ON a.id = v.animal_id
      WHERE v.booster_date IS NOT NULL
        AND v.booster_date >= CURDATE()
        AND v.status = 'DONE'
        ${expClause}
    ) AS events
    ORDER BY date ASC
    LIMIT 50
  `);

  return (result as unknown as any[]).map((r) => ({
    id: r.id,
    type: r.type,
    date: r.date,
    title: r.title,
    animalName: r.animal_name,
  }));
}
