import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import { exploitationMetrics, farmExpenses } from "../db/schema/index.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/rbac.middleware.js";
const dashboardRoutes = new Hono(); dashboardRoutes.use("*", isAuthenticated, requireRole("ADMIN", "MANAGER"));
dashboardRoutes.get("/", async c => { const exploitationId=Number(c.req.query("exploitationId")); if(!Number.isInteger(exploitationId)||exploitationId<=0)return c.json({error:"exploitationId invalide."},400); const [metrics,expenses]=await Promise.all([db.query.exploitationMetrics.findFirst({where:eq(exploitationMetrics.exploitationId,exploitationId)}),db.select().from(farmExpenses).where(eq(farmExpenses.exploitationId,exploitationId))]); const charges=expenses.reduce<Record<string,number>>((a,x)=>{a[x.type]=(a[x.type]??0)+Number(x.amount);return a;},{}); return c.json({data:{totalAnimals:metrics?.totalAnimals??0,males:metrics?.males??0,females:metrics?.females??0,races:metrics?.raceDistribution?JSON.parse(metrics.raceDistribution):{},mortalityRate:Number(metrics?.mortalityRate??0),fertilityRate:Number(metrics?.fertilityRate??0),charges}}); });
export default dashboardRoutes;
