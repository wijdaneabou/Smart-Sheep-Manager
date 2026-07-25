import { Hono } from "hono";
import {
  createAnimalHandler,
  updateAnimalHandler,
  getAnimalByIdHandler,
  listAnimalsHandler,
  deleteAnimalHandler,
} from "../controllers/animals.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const animalsRoutes = new Hono();

animalsRoutes.use("*", isAuthenticated);

animalsRoutes.post("/", requireRole("ADMIN", "MANAGER", "ELEVEUR"), createAnimalHandler);
animalsRoutes.put("/:id", requireRole("ADMIN", "MANAGER", "ELEVEUR"), updateAnimalHandler);
animalsRoutes.get(
  "/:id",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  getAnimalByIdHandler
);
animalsRoutes.get(
  "/",
  requireRole("ADMIN", "MANAGER", "ELEVEUR", "VETERINAIRE", "OUVRIER"),
  listAnimalsHandler
);
animalsRoutes.delete("/:id", requireRole("ADMIN", "MANAGER", "ELEVEUR"), deleteAnimalHandler);

export default animalsRoutes;
