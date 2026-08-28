/**
 * backend/src/controllers/biController.ts
 * ------------------------------------------------------------------
 * Contrôleurs HTTP pour le Module 12 (BI Dashboard). Suit le même
 * pattern que tes autres contrôleurs : lecture des query params,
 * validation Zod, appel du service, réponse JSON.
 *
 * ⚠️ À ADAPTER :
 *   `getAuthUser(c)` est un helper générique qui lit l'utilisateur
 *   posé en contexte par ton middleware JWT. Remplace son contenu par
 *   la façon dont TES autres contrôleurs récupèrent l'utilisateur
 *   connecté (souvent `c.get("user")` ou `c.get("jwtPayload")`).
 *   Idem pour `exploitationId` et `role` : adapte les noms de champs
 *   à ceux de ton payload JWT réel.
 * ------------------------------------------------------------------
 */

import type { Context } from "hono";
import { biQuerySchema } from "../validators/biValidators.js";
import * as biService from "../services/biService.js";
import { createBiExport, type BiExportFormat } from "../services/biExport.service.js";

interface AuthUser {
  id: number;
  roleName: string;
  roleId?: number;
  exploitationId?: number;
}

function getAuthUser(c: Context): AuthUser {
  // Adapte cette ligne à ton middleware d'authentification réel.
  const user = c.get("user") as AuthUser | undefined;
  if (!user) throw new Error("Utilisateur non authentifié (contexte Hono vide)");
  return user;
}

function parseQuery(c: Context) {
  const parsed = biQuerySchema.safeParse({
    exploitationId: c.req.query("exploitationId"),
    dateFrom: c.req.query("dateFrom"),
    dateTo: c.req.query("dateTo"),
    // ---- Filtres croisés (US-12.2) ----
    breed: c.req.query("breed"),
    sex: c.req.query("sex"),
    healthStatus: c.req.query("healthStatus"),
    buildingId: c.req.query("buildingId"),
    lot: c.req.query("lot"),
    ageMin: c.req.query("ageMin"),
    ageMax: c.req.query("ageMax"),
    granularity: c.req.query("granularity"),
  });
  return parsed;
}

/**
 * Restreint l'exploitation demandée à celle de l'utilisateur, sauf
 * pour les rôles ADMIN / COOPERATIVE qui peuvent consulter n'importe
 * quelle exploitation (ou toutes si aucune n'est précisée).
 */
function resolveExploitationId(user: AuthUser, requested?: number): number | undefined {
  const privilegedRoles = ["ADMIN", "COOPERATIVE"];
  if (privilegedRoles.includes(user.roleName)) return requested;
  return user.exploitationId; // un éleveur/manager ne voit que sa propre exploitation
}

// ============================================================
// GET /api/bi/dashboard
// ============================================================
export async function getDashboard(c: Context) {
  const parsed = parseQuery(c);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const user = getAuthUser(c);
  const exploitationId = resolveExploitationId(user, parsed.data.exploitationId);

  const data = await biService.getDashboardOverview({
    exploitationId,
    dateFrom: parsed.data.dateFrom,
    dateTo: parsed.data.dateTo,
    breed: parsed.data.breed,
    sex: parsed.data.sex,
    healthStatus: parsed.data.healthStatus,
    buildingId: parsed.data.buildingId,
    lot: parsed.data.lot,
    ageMin: parsed.data.ageMin,
    ageMax: parsed.data.ageMax,
    granularity: parsed.data.granularity,
  });
  return c.json({ data });
}

// ============================================================
// GET /api/bi/financials
// ============================================================
export async function getFinancials(c: Context) {
  const parsed = parseQuery(c);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const user = getAuthUser(c);
  const exploitationId = resolveExploitationId(user, parsed.data.exploitationId);

  const data = await biService.getFinancialSummary({
    exploitationId,
    dateFrom: parsed.data.dateFrom,
    dateTo: parsed.data.dateTo,
    breed: parsed.data.breed,
    sex: parsed.data.sex,
    healthStatus: parsed.data.healthStatus,
    buildingId: parsed.data.buildingId,
    lot: parsed.data.lot,
    ageMin: parsed.data.ageMin,
    ageMax: parsed.data.ageMax,
    granularity: parsed.data.granularity,
  });
  return c.json({ data });
}

// ============================================================
// GET /api/bi/fattening
// ============================================================
export async function getFattening(c: Context) {
  const parsed = parseQuery(c);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const user = getAuthUser(c);
  const exploitationId = resolveExploitationId(user, parsed.data.exploitationId);

  const data = await biService.getFatteningSummary({
    exploitationId,
    dateFrom: parsed.data.dateFrom,
    dateTo: parsed.data.dateTo,
    breed: parsed.data.breed,
    sex: parsed.data.sex,
    healthStatus: parsed.data.healthStatus,
    buildingId: parsed.data.buildingId,
    lot: parsed.data.lot,
    ageMin: parsed.data.ageMin,
    ageMax: parsed.data.ageMax,
    granularity: parsed.data.granularity,
  });
  return c.json({ data });
}

// ============================================================
// GET /api/bi/benchmark
// ============================================================
export async function getBenchmark(c: Context) {
  const user = getAuthUser(c);
  const isCoopManager = user.roleName === "COOPERATIVE" || user.roleName === "ADMIN";

  if (!isCoopManager) return c.json({ error: "Accès réservé à la coopérative." }, 403);
  const data = await biService.getBenchmark(user.exploitationId, isCoopManager, user.roleName === "COOPERATIVE" ? user.id : undefined);
  return c.json({ data });
}

// Vue multi-exploitations : ne retourne que les exploitations dont la coopérative est propriétaire.
export async function getCooperativeOverview(c: Context) {
  const user = getAuthUser(c);
  if (user.roleName !== "COOPERATIVE" && user.roleName !== "ADMIN") return c.json({ error: "Accès réservé à la coopérative." }, 403);
  // Un administrateur peut consulter l'ensemble ; une coopérative est strictement bornée à ses adhérents.
  const data = await biService.getCooperativeOverview(user.roleName === "ADMIN" ? undefined : user.id);
  return c.json({ data });
}

// ============================================================
// GET /api/bi/alerts
// ============================================================
export async function getAlerts(c: Context) {
  const parsed = parseQuery(c);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const user = getAuthUser(c);
  const exploitationId = resolveExploitationId(user, parsed.data.exploitationId);

  const data = await biService.getActiveAlerts({ exploitationId });
  return c.json({ data });
}

// ============================================================
// GET /api/bi/calendar-events
// ============================================================
export async function getCalendarEvents(c: Context) {
  const parsed = parseQuery(c);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const user = getAuthUser(c);
  const exploitationId = resolveExploitationId(user, parsed.data.exploitationId);

  const data = await biService.getUpcomingCalendarEvents(exploitationId);
  return c.json({ data });
}

// ============================================================
// GET /api/bi/export/:format — US-12.5
// ============================================================
export async function exportReport(c: Context) {
  const parsed = parseQuery(c);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);
  const format = c.req.param("format") as BiExportFormat;
  if (!(["pdf", "csv", "xlsx", "png", "pptx"] as string[]).includes(format)) {
    return c.json({ error: "Format d'export non pris en charge." }, 400);
  }
  const user = getAuthUser(c);
  const exploitationId = resolveExploitationId(user, parsed.data.exploitationId);
  const result = await createBiExport(format, { ...parsed.data, exploitationId });
  const filename = `rapport-bi-${new Date().toISOString().slice(0, 10)}.${result.extension}`;
  c.header("Content-Type", result.contentType);
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  c.header("Cache-Control", "no-store");
  return c.body(result.body as any);
}
