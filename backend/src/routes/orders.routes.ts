import { Hono } from "hono";
import {
  createOrderHandler,
  updateOrderHandler,
  getOrderByIdHandler,
  listOrdersHandler,
  deleteOrderHandler,
} from "../controllers/orders.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const ordersRoutes = new Hono();

ordersRoutes.use("*", isAuthenticated);

ordersRoutes.post("/", requirePermission("ORDERS", "CREATE"), createOrderHandler);
ordersRoutes.put("/:id", requirePermission("ORDERS", "UPDATE"), updateOrderHandler);
ordersRoutes.get(
  "/:id",
  requirePermission("ORDERS", "READ"),
  getOrderByIdHandler
);
ordersRoutes.get(
  "/",
  requirePermission("ORDERS", "READ"),
  listOrdersHandler
);
ordersRoutes.delete("/:id", requirePermission("ORDERS", "DELETE"), deleteOrderHandler);

export default ordersRoutes;
