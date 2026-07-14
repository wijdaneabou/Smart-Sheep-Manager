import { Hono } from "hono";
import { login } from "../controllers/auth.controller.js";

const authRoutes = new Hono();

authRoutes.post("/login", login);

export default authRoutes;