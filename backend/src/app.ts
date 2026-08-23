import { Hono } from "hono";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth.routes.js";
import usersRoutes from "./routes/users.routes.js";
import { serveStatic } from "@hono/node-server/serve-static";

import exploitationsRoutes from "./routes/exploitations.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import animalsRoutes from './routes/animals.routes.js';
import healthRoutes from './routes/health.routes.js';
import batimentsRoutes from "./routes/batiments.routes.js";
import teamsRoutes from "./routes/teams.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import animalHistoryRoutes from "./routes/animalHistory.routes.js";
import animalMovementsRoutes from "./routes/animalMovements.routes.js";
import animalWeightsRoutes from "./routes/animalWeights.routes.js";
import animalBcsRoutes from "./routes/animalBcs.routes.js";
import reproductionRoutes from './routes/reproductionRoutes.js';
import matingRoutes from './routes/matingRoutes.js';
import userExploitationsRoutes from "./routes/userExploitations.routes.js";
import iotShieldsRoutes from "./routes/iotShields.routes.js";
import sensorDataRoutes from "./routes/iotSensorData.routes.js";
import iotAlertsRoutes from "./routes/iotAlerts.routes.js";
import geocodeRoutes from "./routes/geocode.routes.js";
import iotZonesRoutes from "./routes/iotZones.routes.js";
import iotAnalyticsRoutes from "./routes/iotAnalytics.routes.js";
import budgetRoutes from './routes/budget.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import revenueRoutes from './routes/revenue.routes.js';
import cashflowRoutes from './routes/cashflow.routes.js';

import profitabilityRoutes from './routes/profitability.routes.js';
import reportRoutes from './routes/report.routes.js';
import costRoutes from './routes/cost.routes.js';

import fatteningBatchesRoutes from './routes/fatteningBatches.routes.js';
import fatteningFeedRecordsRoutes from './routes/fatteningFeedRecords.routes.js';
import fatteningWeightRecordsRoutes from './routes/fatteningBatchWeightRecords.routes.js';
import fatteningIndividualWeightsRoutes from './routes/fatteningBatchIndividualWeights.routes.js';
import fatteningCostsRoutes from './routes/fatteningBatchCosts.routes.js';
import fatteningPerformanceRoutes from './routes/fatteningPerformance.routes.js';
import fatteningAlertsRoutes from './routes/fatteningAlerts.routes.js';

import feedingRoutes from "./routes/feeding.routes.js";
import feedingStockMgmtRoutes from "./routes/feedingStockMgmt.routes.js";

import clientsRoutes from "./routes/clients.routes.js";
import productsRoutes from "./routes/products.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import deliveriesRoutes from "./routes/deliveries.routes.js";
import frameworkContractsRoutes from "./routes/framework-contracts.routes.js";
import marketplaceRoutes from "./routes/marketplace.routes.js";
import crmRoutes from "./routes/crm.routes.js";


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

app.route("/api/exploitations", exploitationsRoutes);
app.route("/api/sessions", sessionsRoutes);
app.route("/api/audit", auditRoutes);
app.route("/api/batiments", batimentsRoutes);
app.route("/api/teams", teamsRoutes);
app.route("/api/calendar", calendarRoutes);
app.route("/api/exploitation-dashboard", dashboardRoutes);

app.route("/api/animals", animalBcsRoutes);
app.route("/api/animals", animalWeightsRoutes);
app.route("/api/animals", animalHistoryRoutes);
app.route("/api/animals", animalsRoutes);
app.route("/api/movements", animalMovementsRoutes);
app.route('/api/animals', animalsRoutes); 
app.route('/api/health', healthRoutes);
app.route('/api/reproduction-cycles', reproductionRoutes);
app.route('/api/mating-services', matingRoutes);

// ============================================
// 
// ============================================
app.route("/api/iot-shields", iotShieldsRoutes);
app.route("/api/sensor-data", sensorDataRoutes);
app.route("/api/iot-alerts", iotAlertsRoutes);
app.route("/api/iot-zones", iotZonesRoutes);
app.route("/api/geocode", geocodeRoutes);
app.route("/api/iot-analytics", iotAnalyticsRoutes);

// ============================================
app.route("/api", userExploitationsRoutes);
app.route('/api/budgets', budgetRoutes);
app.route('/api/expenses', expenseRoutes);
app.route('/api/revenues', revenueRoutes);
app.route('/api/cashflow', cashflowRoutes);

app.route('/api/profitability', profitabilityRoutes);

app.route('/api/reports', reportRoutes);
app.route('/api/cost', costRoutes);

app.route('/api/fattening/batches', fatteningBatchesRoutes);
app.route('/api/fattening/feed-records', fatteningFeedRecordsRoutes);
app.route('/api/fattening/weight-records', fatteningWeightRecordsRoutes);
app.route('/api/fattening/individual-weights', fatteningIndividualWeightsRoutes);
app.route('/api/fattening/costs', fatteningCostsRoutes);
app.route('/api/fattening/performance', fatteningPerformanceRoutes);
app.route('/api/fattening/alerts', fatteningAlertsRoutes);

app.route('/api/feeding', feedingRoutes);
app.route('/api/feeding-stock', feedingStockMgmtRoutes);

app.route('/api/clients', clientsRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/deliveries', deliveriesRoutes);
app.route('/api/framework-contracts', frameworkContractsRoutes);
app.route('/api/marketplace', marketplaceRoutes);
app.route('/api/crm', crmRoutes);


export default app;
