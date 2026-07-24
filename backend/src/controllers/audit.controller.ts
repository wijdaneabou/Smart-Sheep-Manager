import { Context } from "hono";

import { auditService } from "../services/audit.service.js";

export const listAuditLogs = async (c: Context) => {
  const { userId, module, action, result, from, to, search, page = "1", limit = "20" } =
    c.req.query();

  const filters = {
    userId: userId ? Number(userId) : undefined,
    module,
    action,
    result,
    search,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };

  const data = await auditService.list(filters, Number(page), Number(limit));
  return c.json(data);
};

export const exportAuditCsv = async (c: Context) => {
  const csv = await auditService.exportCsv({});
  c.header("Content-Type", "text/csv");
  c.header("Content-Disposition", "attachment; filename=audit_logs.csv");
  return c.body(csv);
};

export const exportAuditPdf = async (c: Context) => {
  const pdf = await auditService.exportPdf({});
  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", "attachment; filename=audit_logs.pdf");
  return c.body(new Uint8Array(pdf));
};