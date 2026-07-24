import { Context } from "hono";

import { auditService } from "../services/audit.service.js";

function buildFilters(c: Context) {
  const { userId, module, action, result, from, to, search } = c.req.query();

  return {
    userId: userId ? Number(userId) : undefined,
    module,
    action,
    result,
    search,
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };
}

export const listAuditLogs = async (c: Context) => {
  const { page = "1", limit = "20" } = c.req.query();
  const filters = buildFilters(c);

  const data = await auditService.list(filters, Number(page), Number(limit));
  return c.json(data);
};

export const exportAuditCsv = async (c: Context) => {
  const { page = "1", limit = "20" } = c.req.query();
  const filters = buildFilters(c);

  const csv = await auditService.exportCsv(filters, Number(page), Number(limit));

  c.header("Content-Type", "text/csv");
  c.header("Content-Disposition", "attachment; filename=audit_logs.csv");

  return c.body(csv);
};

export const exportAuditPdf = async (c: Context) => {
  const { page = "1", limit = "20" } = c.req.query();
  const filters = buildFilters(c);

  const pdf = await auditService.exportPdf(filters, Number(page), Number(limit));

  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", "attachment; filename=audit_logs.pdf");

  return c.body(new Uint8Array(pdf));
};
