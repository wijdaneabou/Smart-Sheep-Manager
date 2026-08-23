import { Hono } from "hono";
import {
  createDeliveryHandler,
  updateDeliveryHandler,
  getDeliveryByIdHandler,
  listDeliveriesHandler,
  deleteDeliveryHandler,
} from "../controllers/deliveries.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const deliveriesRoutes = new Hono();

deliveriesRoutes.use("*", isAuthenticated);

deliveriesRoutes.post("/", requirePermission("DELIVERIES", "CREATE"), createDeliveryHandler);
deliveriesRoutes.put("/:id", requirePermission("DELIVERIES", "UPDATE"), updateDeliveryHandler);
deliveriesRoutes.get(
  "/:id",
  requirePermission("DELIVERIES", "READ"),
  getDeliveryByIdHandler
);
deliveriesRoutes.get(
  "/",
  requirePermission("DELIVERIES", "READ"),
  listDeliveriesHandler
);
deliveriesRoutes.delete("/:id", requirePermission("DELIVERIES", "DELETE"), deleteDeliveryHandler);

export default deliveriesRoutes;
