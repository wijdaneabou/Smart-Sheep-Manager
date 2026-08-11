import { Hono } from "hono";
import {
  listAlertsHandler,
  getAlertSummaryHandler,
  getAlertByIdHandler,
  resolveAlertHandler,
} from "../controllers/iotAlerts.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const iotAlertsRoutes = new Hono();

// Toutes les routes nécessitent une authentification JWT
iotAlertsRoutes.use("*", isAuthenticated);

// GET /api/iot-alerts?exploitationId=1&resolved=false&type=HIGH_TEMPERATURE
iotAlertsRoutes.get(
  "/",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  listAlertsHandler
);

// GET /api/iot-alerts/summary?exploitationId=1
iotAlertsRoutes.get(
  "/summary",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getAlertSummaryHandler
);

// GET /api/iot-alerts/:id
iotAlertsRoutes.get(
  "/:id",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getAlertByIdHandler
);

// PATCH /api/iot-alerts/:id/resolve
iotAlertsRoutes.patch(
  "/:id/resolve",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  resolveAlertHandler
);

export default iotAlertsRoutes;