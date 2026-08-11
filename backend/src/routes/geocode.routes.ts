import { Hono } from "hono";
import { searchLocationHandler } from "../controllers/geocode.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const geocodeRoutes = new Hono();

geocodeRoutes.use("*", isAuthenticated);

// GET /api/geocode/search?q=Essaouira
geocodeRoutes.get("/search", searchLocationHandler);

export default geocodeRoutes;