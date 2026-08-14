import { Hono } from "hono";
import {
  listAlertsHandler,
  getAlertSummaryHandler,
  getAlertByIdHandler,
  resolveAlertHandler,
} from "../controllers/iotAlerts.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js"; 

const iotAlertsRoutes = new Hono();

// Toutes les routes nécessitent une authentification JWT
iotAlertsRoutes.use("*", isAuthenticated);

// GET /api/iot-alerts?resolved=false&type=HIGH_TEMPERATURE
iotAlertsRoutes.get(
  "/",
  requirePermission('IOT', 'ALERTS:READ'),  
  listAlertsHandler
);

// GET /api/iot-alerts/summary
iotAlertsRoutes.get(
  "/summary",
  requirePermission('IOT', 'ALERTS:READ'),
  getAlertSummaryHandler
);

// GET /api/iot-alerts/:id
iotAlertsRoutes.get(
  "/:id",
  requirePermission('IOT', 'ALERTS:READ'),
  getAlertByIdHandler
);

// PATCH /api/iot-alerts/:id/resolve
iotAlertsRoutes.patch(
  "/:id/resolve",
  requirePermission('IOT', 'ALERTS:UPDATE'), // Resolving is an update action
  resolveAlertHandler
);

export default iotAlertsRoutes;