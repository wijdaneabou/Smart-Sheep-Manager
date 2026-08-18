import { Hono } from "hono";
import {
  createFatteningBatchHandler,
  updateFatteningBatchHandler,
  getFatteningBatchByIdHandler,
  listFatteningBatchesHandler,
  deleteFatteningBatchHandler,
} from "../controllers/fatteningBatches.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const fatteningBatchesRoutes = new Hono();

fatteningBatchesRoutes.use("*", isAuthenticated);

fatteningBatchesRoutes.post("/", requirePermission("FATTENING", "CREATE"), createFatteningBatchHandler);
fatteningBatchesRoutes.put("/:id", requirePermission("FATTENING", "UPDATE"), updateFatteningBatchHandler);
fatteningBatchesRoutes.get(
  "/:id",
  requirePermission("FATTENING", "READ"),
  getFatteningBatchByIdHandler
);
fatteningBatchesRoutes.get(
  "/",
  requirePermission("FATTENING", "READ"),
  listFatteningBatchesHandler
);
fatteningBatchesRoutes.delete("/:id", requirePermission("FATTENING", "DELETE"), deleteFatteningBatchHandler);

export default fatteningBatchesRoutes;
