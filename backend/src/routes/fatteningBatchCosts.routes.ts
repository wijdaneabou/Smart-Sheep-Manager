import { Hono } from "hono";
import {
  createBatchCostHandler,
  updateBatchCostHandler,
  listBatchCostsHandler,
  deleteBatchCostHandler,
} from "../controllers/fatteningBatchCosts.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const fatteningBatchCostsRoutes = new Hono();

fatteningBatchCostsRoutes.use("*", isAuthenticated);

// 🔧 Changed from UPDATE to CREATE
fatteningBatchCostsRoutes.post("/", requirePermission("FATTENING", "CREATE"), createBatchCostHandler);
fatteningBatchCostsRoutes.put("/:id", requirePermission("FATTENING", "UPDATE"), updateBatchCostHandler);
fatteningBatchCostsRoutes.get("/", requirePermission("FATTENING", "READ"), listBatchCostsHandler);
fatteningBatchCostsRoutes.delete("/:id", requirePermission("FATTENING", "DELETE"), deleteBatchCostHandler);

export default fatteningBatchCostsRoutes;