import { Hono } from "hono";
import {
  getTemperatureTrendHandler,
  getGrazingTimeHandler,
  getDistanceHandler,
  compareAnimalsHandler,
} from "../controllers/iotAnalytics.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const iotAnalyticsRoutes = new Hono();

iotAnalyticsRoutes.use("*", isAuthenticated);

const roles = ["ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE"] as const;

// GET /api/iot-analytics/compare?exploitationId=1&days=7
// (déclaré AVANT /:shieldId/* pour que "compare" ne soit pas capturé comme un id)
iotAnalyticsRoutes.get("/compare", requireRole(...roles), compareAnimalsHandler);

iotAnalyticsRoutes.get(
  "/:shieldId/temperature-trend",
  requireRole(...roles),
  getTemperatureTrendHandler
);
iotAnalyticsRoutes.get(
  "/:shieldId/grazing-time",
  requireRole(...roles),
  getGrazingTimeHandler
);
iotAnalyticsRoutes.get("/:shieldId/distance", requireRole(...roles), getDistanceHandler);

export default iotAnalyticsRoutes;