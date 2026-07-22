import { Hono } from "hono";

import {
  listAuditLogs,
  exportAuditCsv,
  exportAuditPdf,
} from "../controllers/audit.controller.js";

const auditRoutes = new Hono();

auditRoutes.get("/", listAuditLogs);

auditRoutes.get("/export/csv", exportAuditCsv);

auditRoutes.get("/export/pdf", exportAuditPdf);

export default auditRoutes;