import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import { serveStatic } from "@hono/node-server/serve-static";
import permissionsRoutes from "./routes/permissions.routes.js";

import exploitationsRoutes from "./routes/exploitations.routes.js";

import sessionsRoutes from "./routes/sessions.routes.js";
import auditRoutes from "./routes/audit.routes.js";

import batimentsRoutes from "./routes/batiments.routes.js";
import teamsRoutes from "./routes/teams.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import animalsRoutes from "./routes/animals.routes.js";
import animalHistoryRoutes from "./routes/animalHistory.routes.js";
import animalMovementsRoutes from "./routes/animalMovements.routes.js";
import animalWeightsRoutes from "./routes/animalWeights.routes.js";
import animalBcsRoutes from "./routes/animalBcs.routes.js";

const app = new Hono();

app.use(cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Device-Info", "x-device-info"],
}));

app.use(async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});
app.use("/uploads/*", serveStatic({ root: "./" }));

app.get("/", (c) => {
  return c.text("Smart Sheep Manager API");
});

app.route("/api/auth", authRoutes);
app.route("/api/users", usersRoutes);
app.use("/uploads/*", serveStatic({ root: "./" }));
app.route("/api/permissions", permissionsRoutes);

app.route("/api/exploitations", exploitationsRoutes);

app.route("/api/sessions", sessionsRoutes);
app.route("/api/audit", auditRoutes);
app.route("/api/batiments", batimentsRoutes);
app.route("/api/teams", teamsRoutes);
app.route("/api/calendar", calendarRoutes);
app.route("/api/exploitation-dashboard", dashboardRoutes);

// Mount more specific sub-routes BEFORE the generic animalsRoutes
// to prevent the GET /:id route from shadowing /:id/bcs, /:id/history, etc.
app.route("/api/animals", animalBcsRoutes);
app.route("/api/animals", animalWeightsRoutes);
app.route("/api/animals", animalHistoryRoutes);
app.route("/api/animals", animalsRoutes);
app.route("/api/movements", animalMovementsRoutes);


export default app;
