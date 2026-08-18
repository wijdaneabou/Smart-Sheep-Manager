import { Hono } from "hono";
import {
  createUserHandler,
  updateUserHandler,
  deactivateUserHandler,
  reactivateUserHandler,
  getUserByIdHandler,
  listUsersHandler,
  getLoginHistoryHandler,
  uploadUserPhotoHandler,
} from "../controllers/users.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requirePermission } from "../middlewares/permissions.middleware.js";

const usersRoutes = new Hono();

usersRoutes.use("*", isAuthenticated);

// POST – requires CREATE
usersRoutes.post("/", requirePermission("USERS", "CREATE"), createUserHandler);

// Helper to get user from context with proper typing
function getCurrentUser(c: any): { id: number } | undefined {
  return c.get("user");
}

// PUT – allow self‑update, otherwise require UPDATE
usersRoutes.put("/:id", async (c, next) => {
  const userIdParam = c.req.param("id");
  const userId = userIdParam ? parseInt(userIdParam, 10) : NaN;
  const currentUser = getCurrentUser(c);
  if (!isNaN(userId) && currentUser?.id === userId) {
    await next();
  } else {
    await requirePermission("USERS", "UPDATE")(c, next);
  }
}, updateUserHandler);

// Deactivation – requires UPDATE
usersRoutes.patch("/:id/deactivate", requirePermission("USERS", "UPDATE"), deactivateUserHandler);
usersRoutes.patch("/:id/reactivate", requirePermission("USERS", "UPDATE"), reactivateUserHandler);

// GET – requires READ
usersRoutes.get("/:id", requirePermission("USERS", "READ"), getUserByIdHandler);

// GET list – requires EXPLOITATIONS:UPDATE
usersRoutes.get("/", requirePermission("EXPLOITATIONS", "UPDATE"), listUsersHandler);

// Login history – requires READ
usersRoutes.get("/:id/login-history", requirePermission("USERS", "READ"), getLoginHistoryHandler);

// Photo upload – allow self‑update, otherwise require UPDATE
usersRoutes.post("/:id/photo", async (c, next) => {
  const userIdParam = c.req.param("id");
  const userId = userIdParam ? parseInt(userIdParam, 10) : NaN;
  const currentUser = getCurrentUser(c);
  if (!isNaN(userId) && currentUser?.id === userId) {
    await next();
  } else {
    await requirePermission("USERS", "UPDATE")(c, next);
  }
}, uploadUserPhotoHandler);

export default usersRoutes;