import { Hono } from "hono";
import {
  createMovementHandler,
  listMovementsHandler,
} from "../controllers/animalMovements.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const animalMovementsRoutes = new Hono();

animalMovementsRoutes.use("*", isAuthenticated);

animalMovementsRoutes.post(
  "/",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE"),
  createMovementHandler
);

animalMovementsRoutes.get(
  "/",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  listMovementsHandler
);

export default animalMovementsRoutes;
