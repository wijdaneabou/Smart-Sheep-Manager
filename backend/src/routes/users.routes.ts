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
import { requireRole } from "../middlewares/rbac.middleware.js";

const usersRoutes = new Hono();

usersRoutes.use("*", isAuthenticated);

usersRoutes.post("/", requireRole("ADMIN"), createUserHandler);
usersRoutes.put("/:id", requireRole("ADMIN"), updateUserHandler);
usersRoutes.patch("/:id/deactivate", requireRole("ADMIN"), deactivateUserHandler);
usersRoutes.patch("/:id/reactivate", requireRole("ADMIN"), reactivateUserHandler);
usersRoutes.get("/:id", requireRole("ADMIN", "MANAGER"), getUserByIdHandler);
usersRoutes.get("/", requireRole("ADMIN", "MANAGER"), listUsersHandler);
usersRoutes.get(
  "/:id/login-history",
  requireRole("ADMIN", "MANAGER"),
  getLoginHistoryHandler
);
usersRoutes.post("/:id/photo", uploadUserPhotoHandler);

export default usersRoutes;