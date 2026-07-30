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

usersRoutes.post("/", requirePermission("USERS", "CREATE"), createUserHandler);
usersRoutes.put("/:id", requirePermission("USERS", "UPDATE"), updateUserHandler);
usersRoutes.patch("/:id/deactivate", requirePermission("USERS", "UPDATE"), deactivateUserHandler);
usersRoutes.patch("/:id/reactivate", requirePermission("USERS", "UPDATE"), reactivateUserHandler);
usersRoutes.get("/:id", requirePermission("USERS", "READ"), getUserByIdHandler);
usersRoutes.get("/", requirePermission("USERS", "READ"), listUsersHandler);
usersRoutes.get("/:id/login-history", requirePermission("USERS", "READ"), getLoginHistoryHandler);
usersRoutes.post("/:id/photo", requirePermission("USERS", "UPDATE"), uploadUserPhotoHandler);

export default usersRoutes;