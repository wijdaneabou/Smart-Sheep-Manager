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
import { requireRole } from "../middlewares/rbac.middleware.js";

const iotShieldsRoutes = new Hono();

iotShieldsRoutes.use("*", isAuthenticated);

// CRUD
iotShieldsRoutes.post("/", requireRole("ADMIN", "MANAGER", "ELEVEUR"), createIotShieldHandler);
iotShieldsRoutes.put("/:id", requireRole("ADMIN", "MANAGER", "ELEVEUR"), updateIotShieldHandler);
iotShieldsRoutes.delete("/:id", requireRole("ADMIN", "MANAGER", "ELEVEUR"), deleteIotShieldHandler);
iotShieldsRoutes.get(
  "/:id",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getIotShieldByIdHandler
);
iotShieldsRoutes.get(
  "/",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  listIotShieldsHandler
);

// IoT-specific actions
iotShieldsRoutes.patch(
  "/:id/associate",
  requireRole("ADMIN", "MANAGER", "ELEVEUR"),
  associateAnimalHandler
);
iotShieldsRoutes.patch(
  "/:id/battery",
  requireRole("ADMIN", "MANAGER", "ELEVEUR"),
  updateBatteryHandler
);
iotShieldsRoutes.patch(
  "/:id/toggle-status",
  requireRole("ADMIN", "MANAGER", "ELEVEUR"),
  toggleStatusHandler
);

export default iotShieldsRoutes;
