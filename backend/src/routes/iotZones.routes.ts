import { Hono } from "hono";
import {
  createZoneHandler,
  listZonesHandler,
  updateZoneHandler,
  deleteZoneHandler,
} from "../controllers/iotZones.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js"; 

const iotZonesRoutes = new Hono();

iotZonesRoutes.use("*", isAuthenticated);

// GET /api/iot-zones
iotZonesRoutes.get(
  "/",
  requirePermission('IOT', 'ZONES:READ'),
  listZonesHandler
);

// POST /api/iot-zones
iotZonesRoutes.post(
  "/",
  requirePermission('IOT', 'ZONES:CREATE'),
  createZoneHandler
);

// PUT /api/iot-zones/:id
iotZonesRoutes.put(
  "/:id",
  requirePermission('IOT', 'ZONES:UPDATE'),
  updateZoneHandler
);

// DELETE /api/iot-zones/:id
iotZonesRoutes.delete(
  "/:id",
  requirePermission('IOT', 'ZONES:DELETE'),
  deleteZoneHandler
);

export default iotZonesRoutes;