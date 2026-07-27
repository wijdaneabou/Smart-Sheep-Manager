import { Hono } from "hono";
import {
  createWeightRecordHandler,
  getGrowthCurveHandler,
  listWeightRecordsHandler,
} from "../controllers/animalWeights.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const animalWeightsRoutes = new Hono();

animalWeightsRoutes.use("*", isAuthenticated);

// POST /api/animals/:id/weights - Créer un enregistrement de poids
animalWeightsRoutes.post(
  "/:id/weights",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE"),
  createWeightRecordHandler
);

// GET /api/animals/:id/weights/growth - Courbe de croissance avec GMQ
animalWeightsRoutes.get(
  "/:id/weights/growth",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getGrowthCurveHandler
);

// GET /api/animals/:id/weights - Lister les enregistrements de poids
animalWeightsRoutes.get(
  "/:id/weights",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  listWeightRecordsHandler
);

export default animalWeightsRoutes;
