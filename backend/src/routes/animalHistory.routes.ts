import { Hono } from "hono";
import {
  getAnimalHistoryHandler,
  exportAnimalHistoryPdfHandler,
} from "../controllers/animalHistory.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const animalHistoryRoutes = new Hono();

animalHistoryRoutes.use("*", isAuthenticated);

animalHistoryRoutes.get(
  "/:id/history",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getAnimalHistoryHandler
);

animalHistoryRoutes.get(
  "/:id/history/export/pdf",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  exportAnimalHistoryPdfHandler
);

export default animalHistoryRoutes;
