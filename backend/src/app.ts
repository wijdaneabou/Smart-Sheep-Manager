import { Hono } from "hono";
import authRoutes from "./routes/auth.routes.js";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Smart Sheep Manager API");
});

app.route("/api/auth", authRoutes);

export default app;