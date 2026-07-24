import { Hono } from "hono";
import {
  login,
  refreshToken,
  getMyPermissions,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  getMe,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const authRoutes = new Hono();

authRoutes.post("/login", login);
authRoutes.post("/refresh", refreshToken);
authRoutes.get("/me", isAuthenticated, getMe);
authRoutes.get("/me/permissions", isAuthenticated, getMyPermissions);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/verify-reset-code", verifyResetCode);
authRoutes.post("/reset-password", resetPassword);

export default authRoutes;