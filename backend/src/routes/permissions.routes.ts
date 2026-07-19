import { Hono } from "hono";
import {
  listRoles,
  listPermissions,
  getRolePermissions,
  updateRolePermissions,
} from "../controllers/permissions.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const permissionsRoutes = new Hono();

permissionsRoutes.use("*", isAuthenticated);

// Only admin can manage permissions
permissionsRoutes.get("/roles", requirePermission("ADMIN", "READ"), listRoles);
permissionsRoutes.get("/", requirePermission("ADMIN", "READ"), listPermissions);
permissionsRoutes.get("/roles/:roleId", requirePermission("ADMIN", "READ"), getRolePermissions);
permissionsRoutes.put("/roles/:roleId", requirePermission("ADMIN", "UPDATE"), updateRolePermissions);

export default permissionsRoutes;