import { Hono } from "hono";

import {
  login,
  logout,
  refreshToken,
  getMyPermissions,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const authRoutes = new Hono();

authRoutes.post("/login", login);

authRoutes.post("/refresh", refreshToken);
authRoutes.get("/me/permissions", isAuthenticated, getMyPermissions);

authRoutes.post("/forgot-password", forgotPassword);

authRoutes.post("/verify-reset-code", verifyResetCode);

authRoutes.post("/reset-password", resetPassword);
authRoutes.post("/logout", logout);

export default authRoutes;