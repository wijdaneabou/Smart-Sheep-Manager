import { Hono } from "hono";

import {
  login,
  refreshToken,

  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/auth.controller.js";

const authRoutes = new Hono();

authRoutes.post("/login", login);

authRoutes.post("/refresh", refreshToken);


authRoutes.post("/forgot-password", forgotPassword);

authRoutes.post("/verify-reset-code", verifyResetCode);

authRoutes.post("/reset-password", resetPassword);


export default authRoutes;