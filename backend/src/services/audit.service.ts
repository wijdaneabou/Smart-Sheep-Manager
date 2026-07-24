import {
  auditRepository,
  AuditFilters,
} from "../repositories/audit.repository.js";

import { buildCsv } from "../utils/csv.js";
import { createSimplePdf } from "../utils/simple-pdf.js";

function padOrTrim(value: string, width: number) {
  const text = value.length > width ? `${value.slice(0, Math.max(0, width - 1))}…` : value;
  return text.padEnd(width, " ");
}

function formatAuditLine(row: any) {
  const user = row.firstName ? `${row.firstName} ${row.lastName}` : "Utilisateur supprime";
  const date = row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : "-";

  return [
    padOrTrim(String(row.id ?? "-"), 5),
    padOrTrim(user, 24),
    padOrTrim(row.email ?? "-", 26),
    padOrTrim(row.module ?? "-", 18),
    padOrTrim(row.action ?? "-", 16),
    padOrTrim(row.result ?? "-", 10),
    padOrTrim(row.ip ?? "-", 16),
    date,
  ].join(" | ");
}

export const auditService = {
  async log(data: {
    userId?: number;
    module: string;
    action: string;
    description?: string;
    result: string;
    ip?: string;
    userAgent?: string;
  }) {
    await auditRepository.create({
      userId: data.userId,
      module: data.module,
      action: data.action,
      description: data.description,
      result: data.result,
      ip: data.ip,
      userAgent: data.userAgent,
    });
  },

  async list(filters: AuditFilters, page: number, limit: number) {
    return await auditRepository.findAll(filters, page, limit);
  },

  async exportCsv(filters: AuditFilters, page = 1, limit = 20) {
    const rows = await auditRepository.findAll(filters, page, limit);

    return buildCsv(rows as Array<Record<string, unknown>>, [
      { label: "ID", value: "id" },
      {
        label: "Utilisateur",
        value: (row: any) =>
          row.firstName ? `${row.firstName} ${row.lastName}` : "Utilisateur supprime",
      },
      { label: "Email", value: "email" },
      { label: "Module", value: "module" },
      { label: "Action", value: "action" },
      { label: "Description", value: "description" },
      { label: "Resultat", value: "result" },
      { label: "IP", value: "ip" },
      { label: "Navigateur", value: "userAgent" },
      { label: "Date", value: (row: any) => row.createdAt ? new Date(row.createdAt).toLocaleString("fr-FR") : "" },
    ]);
  },

  async exportPdf(filters: AuditFilters, page = 1, limit = 20) {
    const rows = await auditRepository.findAll(filters, page, limit);

    const lines = rows.map((row: any) => formatAuditLine(row));
    const pdf = createSimplePdf(
      "Smart Sheep Manager",
      "Journal d audit",
      [
        "ID    | Utilisateur               | Email                      | Module             | Action           | Resultat  | IP              | Date",
        ...lines,
      ]
    );

    return pdf;
  },
};
