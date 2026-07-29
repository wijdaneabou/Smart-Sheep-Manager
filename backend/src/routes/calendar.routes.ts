import { Hono } from "hono";
import { createEvent, deleteEvent, listEvents, updateEvent } from "../controllers/calendar.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
const calendarRoutes = new Hono();
calendarRoutes.use("*", isAuthenticated, requireRole("ADMIN", "MANAGER", "ELEVEUR"));
calendarRoutes.get("/events", listEvents).post("/events", createEvent).put("/events/:id", updateEvent).delete("/events/:id", deleteEvent);
export default calendarRoutes;
