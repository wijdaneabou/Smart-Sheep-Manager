import { Hono } from "hono";
import { createContract, createEmployee, createHours, createSchedule, labourCosts, listContracts, listEmployees, listHours, listSchedules, updateEmployee } from "../controllers/teams.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";

const teamsRoutes = new Hono();
teamsRoutes.use("*", isAuthenticated, requireRole("ADMIN", "MANAGER"));
teamsRoutes.get("/employees", listEmployees).post("/employees", createEmployee).put("/employees/:id", updateEmployee);
teamsRoutes.get("/contracts", listContracts).post("/contracts", createContract);
teamsRoutes.get("/schedules", listSchedules).post("/schedules", createSchedule);
teamsRoutes.get("/hours", listHours).post("/hours", createHours);
teamsRoutes.get("/costs", labourCosts);
export default teamsRoutes;
