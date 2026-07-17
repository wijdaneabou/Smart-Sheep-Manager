import { Hono } from "hono";

import {
  login,
  refreshToken,
<<<<<<< Updated upstream
=======
  forgotPassword,
  verifyResetCode,
  resetPassword,
>>>>>>> Stashed changes
} from "../controllers/auth.controller.js";

const authRoutes = new Hono();

authRoutes.post("/login", login);

authRoutes.post("/refresh", refreshToken);
<<<<<<< Updated upstream
=======

authRoutes.post("/forgot-password", forgotPassword);

authRoutes.post("/verify-reset-code", verifyResetCode);

authRoutes.post("/reset-password", resetPassword);
>>>>>>> Stashed changes

export default authRoutes;