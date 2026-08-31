import { Hono } from "hono";
import {
  createClientHandler,
  updateClientHandler,
  getClientByIdHandler,
  listClientsHandler,
  deleteClientHandler,
} from "../controllers/clients.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const clientsRoutes = new Hono();

clientsRoutes.use("*", isAuthenticated);

clientsRoutes.post("/", requirePermission("CLIENTS", "CREATE"), createClientHandler);
clientsRoutes.put("/:id", requirePermission("CLIENTS", "UPDATE"), updateClientHandler);
clientsRoutes.get(
  "/:id",
  requirePermission("CLIENTS", "READ"),
  getClientByIdHandler
);
clientsRoutes.get(
  "/",
  requirePermission("CLIENTS", "READ"),
  listClientsHandler
);
clientsRoutes.delete("/:id", requirePermission("CLIENTS", "DELETE"), deleteClientHandler);

export default clientsRoutes;
