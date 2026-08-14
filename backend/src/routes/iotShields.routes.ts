import { Hono } from "hono";
import {
  createIotShieldHandler,
  updateIotShieldHandler,
  getIotShieldByIdHandler,
  deleteIotShieldHandler,
  listIotShieldsHandler,
  associateAnimalHandler,
  updateBatteryHandler,
  toggleStatusHandler,
} from "../controllers/iotShields.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js"; // ✅ your existing file

const iotShieldsRoutes = new Hono();

iotShieldsRoutes.use("*", isAuthenticated);

// CRUD
iotShieldsRoutes.post(
  "/",
  requirePermission('IOT', 'SHIELDS:CREATE'),  // ✅ uses your middleware
  createIotShieldHandler
);

iotShieldsRoutes.put(
  "/:id",
  requirePermission('IOT', 'SHIELDS:UPDATE'),
  updateIotShieldHandler
);

iotShieldsRoutes.delete(
  "/:id",
  requirePermission('IOT', 'SHIELDS:DELETE'),
  deleteIotShieldHandler
);

iotShieldsRoutes.get(
  "/:id",
  requirePermission('IOT', 'SHIELDS:READ'),
  getIotShieldByIdHandler
);

iotShieldsRoutes.get(
  "/",
  requirePermission('IOT', 'SHIELDS:READ'),
  listIotShieldsHandler
);

// IoT-specific actions
iotShieldsRoutes.patch(
  "/:id/associate",
  requirePermission('IOT', 'SHIELDS:UPDATE'),
  associateAnimalHandler
);

iotShieldsRoutes.patch(
  "/:id/battery",
  requirePermission('IOT', 'SHIELDS:UPDATE'),
  updateBatteryHandler
);

iotShieldsRoutes.patch(
  "/:id/toggle-status",
  requirePermission('IOT', 'SHIELDS:UPDATE'),
  toggleStatusHandler
);

export default iotShieldsRoutes;