import { Hono } from "hono";
import {
  createZoneHandler,
  listZonesHandler,
  updateZoneHandler,
  deleteZoneHandler,
} from "../controllers/iotZones.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const iotZonesRoutes = new Hono();

iotZonesRoutes.use("*", isAuthenticated);

// GET /api/iot-zones?exploitationId=1
iotZonesRoutes.get(
  "/",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  listZonesHandler
);

// POST /api/iot-zones
iotZonesRoutes.post(
  "/",
  requireRole("ADMIN", "MANAGER", "ELEVEUR"),
  createZoneHandler
);

// PUT /api/iot-zones/:id
iotZonesRoutes.put(
  "/:id",
  requireRole("ADMIN", "MANAGER", "ELEVEUR"),
  updateZoneHandler
);

// DELETE /api/iot-zones/:id
iotZonesRoutes.delete(
  "/:id",
  requireRole("ADMIN", "MANAGER", "ELEVEUR"),
  deleteZoneHandler
);

export default iotZonesRoutes;