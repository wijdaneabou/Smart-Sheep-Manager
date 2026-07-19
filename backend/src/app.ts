import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import { serveStatic } from "@hono/node-server/serve-static";
import permissionsRoutes from "./routes/permissions.routes.js";

const app = new Hono();

// CORS - allow all origins for development
app.use(cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Request logger
app.use(async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

app.get("/", (c) => {
  return c.text("Smart Sheep Manager API");
});

app.route("/api/auth", authRoutes);
app.route("/api/users", usersRoutes);
app.use("/uploads/*", serveStatic({ root: "./" }));
app.route("/api/permissions", permissionsRoutes);

export default app;