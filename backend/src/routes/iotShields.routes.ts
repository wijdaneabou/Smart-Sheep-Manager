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
import { listShieldSensors, createShieldSensor, deleteShieldSensor } from "../services/iotShields.service.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const iotShieldsRoutes = new Hono();

iotShieldsRoutes.use("*", isAuthenticated);

// CRUD
iotShieldsRoutes.post(
  "/",
  requirePermission('IOT', 'SHIELDS:CREATE'),
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

// ── Shield Sensors ──

iotShieldsRoutes.get(
  "/:id/sensors",
  requirePermission('IOT', 'SHIELDS:READ'),
  async (c) => {
    const shieldId = Number(c.req.param("id"));
    if (Number.isNaN(shieldId)) {
      return c.json({ error: "Identifiant invalide." }, 400);
    }
    const sensors = await listShieldSensors(shieldId);
    return c.json({ data: sensors }, 200);
  }
);

iotShieldsRoutes.post(
  "/:id/sensors",
  requirePermission('IOT', 'SHIELDS:UPDATE'),
  async (c) => {
    const shieldId = Number(c.req.param("id"));
    if (Number.isNaN(shieldId)) {
      return c.json({ error: "Identifiant invalide." }, 400);
    }
    const body = await c.req.json();
    const { sensorType } = body;
    if (!sensorType || !["TEMPERATURE", "ACTIVITY", "GPS"].includes(sensorType)) {
      return c.json({ error: "Type de capteur invalide." }, 400);
    }
    const sensor = await createShieldSensor(shieldId, sensorType);
    return c.json({ data: sensor }, 201);
  }
);

iotShieldsRoutes.delete(
  "/:id/sensors/:sensorId",
  requirePermission('IOT', 'SHIELDS:UPDATE'),
  async (c) => {
    const sensorId = Number(c.req.param("sensorId"));
    if (Number.isNaN(sensorId)) {
      return c.json({ error: "Identifiant de capteur invalide." }, 400);
    }
    await deleteShieldSensor(sensorId);
    return c.json({ data: { deleted: true } }, 200);
  }
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
