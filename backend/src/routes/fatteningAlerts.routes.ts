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

fatteningAlertsRoutes.post(
  "/batch/:batchId/evaluate",
  requirePermission("FATTENING", "UPDATE"),
  evaluateFatteningAlertsHandler
);

fatteningAlertsRoutes.patch(
  "/:id/resolve",
  requirePermission("FATTENING", "UPDATE"),
  resolveFatteningAlertHandler
);

export default fatteningAlertsRoutes;
