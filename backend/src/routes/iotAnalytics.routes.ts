import { Hono } from "hono";
import {
  getTemperatureTrendHandler,
  getGrazingTimeHandler,
  getDistanceHandler,
  compareAnimalsHandler,
} from "../controllers/iotAnalytics.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const iotAnalyticsRoutes = new Hono();

iotAnalyticsRoutes.use("*", isAuthenticated);

// GET /api/iot-analytics/compare?exploitationId=1&days=7
iotAnalyticsRoutes.get(
  "/compare",
  requirePermission('IOT', 'ANALYTICS:READ'),
  compareAnimalsHandler
);

iotAnalyticsRoutes.get(
  "/:shieldId/temperature-trend",
  requirePermission('IOT', 'ANALYTICS:READ'),
  getTemperatureTrendHandler
);

iotAnalyticsRoutes.get(
  "/:shieldId/grazing-time",
  requirePermission('IOT', 'ANALYTICS:READ'),
  getGrazingTimeHandler
);

iotAnalyticsRoutes.get(
  "/:shieldId/distance",
  requirePermission('IOT', 'ANALYTICS:READ'),
  getDistanceHandler
);

export default iotAnalyticsRoutes;