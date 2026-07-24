import { findAllSessions } from "../repositories/sessions.repository.js";

import { buildCsv } from "../utils/csv.js";
import { createSimplePdf } from "../utils/simple-pdf.js";

function padOrTrim(value: string, width: number) {
  const text = value.length > width ? `${value.slice(0, Math.max(0, width - 1))}…` : value;
  return text.padEnd(width, " ");
}

function formatSessionLine(row: any) {
  const user = row.firstName ? `${row.firstName} ${row.lastName}` : "Utilisateur inconnu";
  const status = row.isActive ? "ACTIVE" : "FERMEE";
  const loginAt = row.loginAt ? new Date(row.loginAt).toLocaleString("fr-FR") : "-";
  const logoutAt = row.logoutAt ? new Date(row.logoutAt).toLocaleString("fr-FR") : "-";

  return [
    padOrTrim(String(row.id ?? "-"), 5),
    padOrTrim(user, 24),
    padOrTrim(row.email ?? "-", 28),
    padOrTrim(status, 10),
    padOrTrim(row.ip ?? "-", 16),
    padOrTrim(row.userAgent ?? "-", 28),
    padOrTrim(loginAt, 20),
    logoutAt,
  ].join(" | ");
}

export const sessionExportService = {
  async exportCsv(page = 1, limit = 20, search?: string) {
    const rows = await findAllSessions(page, limit, search);

    return buildCsv(rows as Array<Record<string, unknown>>, [
      { label: "ID", value: "id" },
      {
        label: "Utilisateur",
        value: (row: any) =>
          row.firstName ? `${row.firstName} ${row.lastName}` : "Utilisateur inconnu",
      },
      { label: "Email", value: "email" },
      { label: "IP", value: "ip" },
      { label: "Appareil", value: "userAgent" },
      {
        label: "Statut",
        value: (row: any) => (row.isActive ? "ACTIVE" : "FERMEE"),
      },
      { label: "Date de connexion", value: (row: any) => row.loginAt ? new Date(row.loginAt).toLocaleString("fr-FR") : "" },
      { label: "Date de deconnexion", value: (row: any) => row.logoutAt ? new Date(row.logoutAt).toLocaleString("fr-FR") : "" },
    ]);
  },

  async exportPdf(page = 1, limit = 20, search?: string) {
    const rows = await findAllSessions(page, limit, search);
    const lines = rows.map((row: any) => formatSessionLine(row));

    return createSimplePdf(
      "Smart Sheep Manager",
      "Journal des connexions",
      [
        "ID    | Utilisateur               | Email                       | Statut    | IP              | Appareil                     | Connexion           | Deconnexion",
        ...lines,
      ]
    );
  },
};
