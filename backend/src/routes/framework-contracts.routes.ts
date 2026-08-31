import { Hono } from "hono";
import {
  createFrameworkContractHandler,
  updateFrameworkContractHandler,
  getFrameworkContractByIdHandler,
  listFrameworkContractsHandler,
  deleteFrameworkContractHandler,
} from "../controllers/framework-contracts.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const frameworkContractsRoutes = new Hono();

frameworkContractsRoutes.use("*", isAuthenticated);

frameworkContractsRoutes.post("/", requirePermission("FRAMEWORK_CONTRACTS", "CREATE"), createFrameworkContractHandler);
frameworkContractsRoutes.put("/:id", requirePermission("FRAMEWORK_CONTRACTS", "UPDATE"), updateFrameworkContractHandler);
frameworkContractsRoutes.get(
  "/:id",
  requirePermission("FRAMEWORK_CONTRACTS", "READ"),
  getFrameworkContractByIdHandler
);
frameworkContractsRoutes.get(
  "/",
  requirePermission("FRAMEWORK_CONTRACTS", "READ"),
  listFrameworkContractsHandler
);
frameworkContractsRoutes.delete("/:id", requirePermission("FRAMEWORK_CONTRACTS", "DELETE"), deleteFrameworkContractHandler);

export default frameworkContractsRoutes;
