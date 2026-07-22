import { exportAllSessions } from "../repositories/sessions.repository.js";

import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import { PassThrough } from "stream";

export const sessionExportService = {

  async exportCsv() {
    const rows = await exportAllSessions();

    const parser = new Parser({
      fields: [
        { label: "ID", value: "id" },
        {
          label: "Utilisateur",
          value: (row: any) =>
            row.firstName
              ? `${row.firstName} ${row.lastName}`
              : "Utilisateur inconnu",
        },
        { label: "Email", value: "email" },
        { label: "IP", value: "ip" },
        { label: "Appareil", value: "userAgent" },
        {
          label: "Statut",
          value: (row: any) => (row.isActive ? "ACTIVE" : "FERMÉE"),
        },
        { label: "Date de connexion", value: "loginAt" },
        { label: "Date de déconnexion", value: "logoutAt" },
      ],
    });

    return parser.parse(rows);
  },

  async exportPdf() {
  const rows = await exportAllSessions();

  const doc = new PDFDocument({
    margin: 25,
    size: "A4",
    layout: "landscape",
  });

  const stream = new PassThrough();
  const buffers: Buffer[] = [];
  stream.on("data", (chunk) => buffers.push(chunk));
  doc.pipe(stream);

  doc.fontSize(18).text("Smart Sheep Manager", { align: "center" });
  doc.fontSize(13).text("Journal des connexions", { align: "center" });
  doc.moveDown(1);

  // ✅ 8 colonnes, largeurs recalculées pour tenir sur A4 paysage (~792pt utiles)
  const columns = [
    { key: "id", label: "ID", width: 35 },
    { key: "user", label: "Utilisateur", width: 130 },
    { key: "email", label: "Email", width: 140 },
    { key: "status", label: "Statut", width: 65 },
    { key: "ip", label: "IP", width: 85 },
    { key: "userAgent", label: "Appareil", width: 200 },
    { key: "loginAt", label: "Connexion", width: 90 },
    { key: "logoutAt", label: "Déconnexion", width: 90 },
  ];

  const tableLeft = doc.page.margins.left;
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  const rowHeight = 22;
  const pageBottom = doc.page.height - doc.page.margins.bottom;

  let y = doc.y;

  function drawRowBackground(rowY: number, color: string) {
    doc.rect(tableLeft, rowY, tableWidth, rowHeight).fill(color);
    doc.fillColor("#000");
  }

  function drawHeader() {
    drawRowBackground(y, "#16A34A");
    doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");

    let x = tableLeft;
    columns.forEach((col) => {
      doc.text(col.label, x + 4, y + 6, { width: col.width - 8 });
      x += col.width;
    });

    doc.fillColor("#000").font("Helvetica");
    y += rowHeight;
  }

  function drawRow(row: any, index: number) {
    if (y + rowHeight > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader();
    }

    drawRowBackground(y, index % 2 === 0 ? "#F0FDF4" : "#ffffff");

    const userLabel = row.firstName
      ? `${row.firstName} ${row.lastName}`
      : "Utilisateur inconnu";

    const values: Record<string, string> = {
      id: String(row.id),
      user: userLabel,
      email: row.email ?? "-",
      status: row.isActive ? "ACTIVE" : "FERMÉE",
      ip: row.ip ?? "-",
      userAgent: row.userAgent ?? "-",
      loginAt: row.loginAt ? new Date(row.loginAt).toLocaleString("fr-FR") : "-",
      logoutAt: row.logoutAt ? new Date(row.logoutAt).toLocaleString("fr-FR") : "-",
    };

    doc.fontSize(7);
    let x = tableLeft;

    columns.forEach((col) => {
      if (col.key === "status") {
        doc.fillColor(row.isActive ? "#16A34A" : "#6B7280");
        doc.font("Helvetica-Bold");
      } else {
        doc.fillColor("#111827");
        doc.font("Helvetica");
      }

      doc.text(values[col.key], x + 4, y + 6, {
        width: col.width - 8,
        ellipsis: true,
      });

      x += col.width;
    });

    doc.fillColor("#000").font("Helvetica");
    y += rowHeight;
  }

  drawHeader();
  rows.forEach((row: any, i: number) => drawRow(row, i));

  doc.fontSize(8).fillColor("#9ca3af");
  doc.text(
    `Généré le ${new Date().toLocaleString("fr-FR")} — ${rows.length} entrée(s)`,
    tableLeft,
    y + 10
  );

  doc.end();

  return await new Promise<Buffer>((resolve) => {
    stream.on("end", () => resolve(Buffer.concat(buffers)));
  });
},
};