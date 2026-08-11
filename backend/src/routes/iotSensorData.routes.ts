import { Hono } from "hono";
import {
  createSensorDataHandler,
  getLatestByShieldHandler,
  getLatestAllHandler,
  getHistoryHandler,
} from "../controllers/iotSensorData.controller.js";
import { verifyShieldApiKey } from "../middlewares/apiKey.middleware.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const sensorDataRoutes = new Hono();

// POST /api/sensor-data – authentification par clé API (shield)
sensorDataRoutes.post("/", verifyShieldApiKey, createSensorDataHandler);

// Routes protégées par JWT (pour les utilisateurs)
sensorDataRoutes.use("/latest", isAuthenticated);
sensorDataRoutes.use("/latest/*", isAuthenticated);
sensorDataRoutes.use("/history/*", isAuthenticated);

// GET /api/sensor-data/latest/:shieldId – dernière mesure d'un bouclier spécifique
sensorDataRoutes.get(
  "/latest/:shieldId",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getLatestByShieldHandler
);

// GET /api/sensor-data/latest – toutes les dernières mesures de l'exploitation
sensorDataRoutes.get(
  "/latest",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getLatestAllHandler
);

// GET /api/sensor-data/history/:shieldId?limit=100&offset=0 – historique
sensorDataRoutes.get(
  "/history/:shieldId",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getHistoryHandler
);

export default sensorDataRoutes;