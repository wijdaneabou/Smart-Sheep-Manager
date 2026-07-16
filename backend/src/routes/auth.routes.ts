import { Hono } from "hono";
import {
  login,
  refreshToken,
} from "../controllers/auth.controller.js";

const authRoutes = new Hono();

authRoutes.post("/login", login);
authRoutes.post("/refresh", refreshToken);

export default authRoutes;