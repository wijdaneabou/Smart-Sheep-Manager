import { Hono } from "hono";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js"
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Smart Sheep Manager API");
});


app.route("/api/auth", authRoutes);
app.route("/api/users", usersRoutes);
app.use("/uploads/*", serveStatic({ root: "./" }));



export default app;