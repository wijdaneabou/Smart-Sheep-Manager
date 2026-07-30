import { Hono } from "hono";
import {
  createBcsRecordHandler,
  getBcsHistoryHandler,
  getLatestBcsHandler,
  getHerdBcsSummaryHandler,
} from "../controllers/animalBcs.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const animalBcsRoutes = new Hono();

animalBcsRoutes.use("*", isAuthenticated);

// GET /api/animals/bcs/summary - Résumé global BCS de l'élevage
animalBcsRoutes.get(
  "/bcs/summary",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getHerdBcsSummaryHandler
);

// POST /api/animals/:id/bcs - Créer une évaluation BCS pour un animal
animalBcsRoutes.post(
  "/:id/bcs",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE"),
  createBcsRecordHandler
);

// GET /api/animals/:id/bcs/latest - Obtenir le dernier score BCS d'un animal
animalBcsRoutes.get(
  "/:id/bcs/latest",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getLatestBcsHandler
);

// GET /api/animals/:id/bcs - Obtenir l'historique BCS d'un animal
animalBcsRoutes.get(
  "/:id/bcs",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getBcsHistoryHandler
);

export default animalBcsRoutes;
