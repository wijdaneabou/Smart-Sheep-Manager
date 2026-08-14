import { Hono } from "hono";
import { compareBatchPerformanceHandler } from "../controllers/fatteningPerformance.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const fatteningPerformanceRoutes = new Hono();

fatteningPerformanceRoutes.use("*", isAuthenticated);

fatteningPerformanceRoutes.get(
  "/",
  requirePermission("FATTENING", "READ"),
  compareBatchPerformanceHandler
);

export default fatteningPerformanceRoutes;
