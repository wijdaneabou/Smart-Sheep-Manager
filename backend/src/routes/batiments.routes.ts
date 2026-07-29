import { Hono } from "hono";
import {
  createBatimentHandler,
  updateBatimentHandler,
  getBatimentByIdHandler,
  deleteBatimentHandler,
  listBatimentsHandler,
} from "../controllers/batiments.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const batimentsRoutes = new Hono();

batimentsRoutes.use("*", isAuthenticated);

batimentsRoutes.post("/", requireRole("ADMIN", "ELEVEUR"), createBatimentHandler);
batimentsRoutes.put("/:id", requireRole("ADMIN", "ELEVEUR"), updateBatimentHandler);
batimentsRoutes.delete("/:id", requireRole("ADMIN", "ELEVEUR"), deleteBatimentHandler);
batimentsRoutes.get(
  "/:id",
  requireRole("ADMIN", "MANAGER", "ELEVEUR"),
  getBatimentByIdHandler
);
batimentsRoutes.get(
  "/",
  requireRole("ADMIN", "MANAGER", "ELEVEUR"),
  listBatimentsHandler
);

export default batimentsRoutes;