import {
  auditRepository,
  AuditFilters,
} from "../repositories/audit.repository.js";

import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import { PassThrough } from "stream";

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

  async list(
    filters: AuditFilters,
    page: number,
    limit: number
  ) {

    return await auditRepository.findAll(
      filters,
      page,
      limit
    );

  },

  async exportCsv(filters: AuditFilters) {

    const rows =
      await auditRepository.export(filters);

    const parser = new Parser({
      fields: [
        { label: "ID", value: "id" },
        {
          label: "Utilisateur",
          value: (row: any) =>
            row.firstName
              ? `${row.firstName} ${row.lastName}`
              : "Utilisateur supprimé",
        },
        { label: "Email", value: "email" },
        { label: "Module", value: "module" },
        { label: "Action", value: "action" },
        { label: "Description", value: "description" },
        { label: "Résultat", value: "result" },
        { label: "IP", value: "ip" },
        { label: "Navigateur", value: "userAgent" },
        { label: "Date", value: "createdAt" },
      ],
    });

    return parser.parse(rows);

  },

  async exportPdf(filters: AuditFilters) {

    const rows =
      await auditRepository.export(filters);

    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: "landscape",
    });

    const stream = new PassThrough();
    const buffers: Buffer[] = [];

    stream.on("data", (chunk) => {
      buffers.push(chunk);
    });

    doc.pipe(stream);

    // --- En-tête du document ---
    doc.fontSize(18).fillColor("#000").text("Smart Sheep Manager", { align: "center" });
    doc.fontSize(13).text("Journal d'audit", { align: "center" });
    doc.moveDown(1);

    // --- Définition des colonnes ---
    const columns = [
      { key: "createdAt", label: "Date", width: 100 },
      { key: "user", label: "Utilisateur", width: 150 },
      { key: "module", label: "Module", width: 90 },
      { key: "action", label: "Action", width: 90 },
      { key: "result", label: "Résultat", width: 70 },
      { key: "ip", label: "IP", width: 90 },
      { key: "description", label: "Description", width: 190 },
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
      drawRowBackground(y, "#2563eb");
      doc.fillColor("#fff").fontSize(9).font("Helvetica-Bold");

      let x = tableLeft;
      columns.forEach((col) => {
        doc.text(col.label, x + 4, y + 6, { width: col.width - 8 });
        x += col.width;
      });

      doc.fillColor("#000").font("Helvetica");
      y += rowHeight;
    }

    function drawRow(row: any, index: number) {
      // Saut de page si on dépasse la limite basse
      if (y + rowHeight > pageBottom) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
      }

      drawRowBackground(y, index % 2 === 0 ? "#f9fafb" : "#ffffff");

      const userLabel = row.firstName
        ? `${row.firstName} ${row.lastName}`
        : "Utilisateur supprimé";

      const values: Record<string, string> = {
        createdAt: row.createdAt
          ? new Date(row.createdAt).toLocaleString("fr-FR")
          : "-",
        user: userLabel,
        module: row.module ?? "-",
        action: row.action ?? "-",
        result: row.result ?? "-",
        ip: row.ip ?? "-",
        description: row.description ?? "-",
      };

      doc.fontSize(8);
      let x = tableLeft;

      columns.forEach((col) => {
        // Coloration conditionnelle pour la colonne Résultat
        if (col.key === "result") {
          doc.fillColor(row.result === "SUCCESS" ? "#16a34a" : "#dc2626");
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
    rows.forEach((row, i) => drawRow(row, i));

    // --- Pied de page récapitulatif ---
    doc.fontSize(8).fillColor("#9ca3af");
    doc.text(
      `Généré le ${new Date().toLocaleString("fr-FR")} — ${rows.length} entrée(s)`,
      tableLeft,
      y + 10
    );

    doc.end();

    return await new Promise<Buffer>((resolve) => {
      stream.on("end", () => {
        resolve(Buffer.concat(buffers));
      });
    });
  },

};