import { Hono } from "hono";
import {
  listFatteningAlertsHandler,
  resolveFatteningAlertHandler,
  evaluateFatteningAlertsHandler,
  getFatteningAlertSummaryHandler,
} from "../controllers/fatteningAlerts.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const fatteningAlertsRoutes = new Hono();

fatteningAlertsRoutes.use("*", isAuthenticated);

fatteningAlertsRoutes.get(
  "/",
  requirePermission("FATTENING", "READ"),
  listFatteningAlertsHandler
);

fatteningAlertsRoutes.get(
  "/summary",
  requirePermission("FATTENING", "READ"),
  getFatteningAlertSummaryHandler
);

// 🔧 Changed from UPDATE to CREATE (generating new alerts)
fatteningAlertsRoutes.post(
  "/batch/:batchId/evaluate",
  requirePermission("FATTENING", "CREATE"),
  evaluateFatteningAlertsHandler
);

// Resolving an alert = UPDATE (correct)
fatteningAlertsRoutes.patch(
  "/:id/resolve",
  requirePermission("FATTENING", "UPDATE"),
  resolveFatteningAlertHandler
);

export default fatteningAlertsRoutes;