import { Hono } from "hono";
import {
  createSensorDataHandler,
  getLatestByShieldHandler,
  getLatestAllHandler,
  getHistoryHandler,
} from "../controllers/iotSensorData.controller.js";
import { verifyShieldApiKey } from "../middlewares/apiKey.middleware.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js"; 

const sensorDataRoutes = new Hono();

// POST /api/sensor-data – authentification par clé API (shield) – no permission check needed
sensorDataRoutes.post("/", verifyShieldApiKey, createSensorDataHandler);

// Routes protégées par JWT (pour les utilisateurs)
sensorDataRoutes.use("/latest", isAuthenticated);
sensorDataRoutes.use("/latest/*", isAuthenticated);
sensorDataRoutes.use("/history/*", isAuthenticated);

// GET /api/sensor-data/latest/:shieldId – dernière mesure d'un bouclier spécifique
sensorDataRoutes.get(
  "/latest/:shieldId",
  requirePermission('IOT', 'SENSOR:READ'),  
  getLatestByShieldHandler
);

// GET /api/sensor-data/latest – toutes les dernières mesures de l'exploitation
sensorDataRoutes.get(
  "/latest",
  requirePermission('IOT', 'SENSOR:READ'),
  getLatestAllHandler
);

// GET /api/sensor-data/history/:shieldId?limit=100&offset=0 – historique
sensorDataRoutes.get(
  "/history/:shieldId",
  requirePermission('IOT', 'SENSOR:READ'),
  getHistoryHandler
);

export default sensorDataRoutes;