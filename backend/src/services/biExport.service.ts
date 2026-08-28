import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import pptxgen from "pptxgenjs";
import { Parser } from "json2csv";
import { deflateSync } from "node:zlib";
import * as biService from "./biService.js";
import type { BiFilters } from "./biService.js";

export type BiExportFormat = "pdf" | "csv" | "xlsx" | "png" | "pptx";

type Report = Awaited<ReturnType<typeof buildReport>>;

export async function createBiExport(format: BiExportFormat, filters: BiFilters): Promise<{ body: Uint8Array; contentType: string; extension: string }> {
  const report = await buildReport(filters);
  switch (format) {
    case "csv": return { body: Buffer.from(createCsv(report), "utf8"), contentType: "text/csv; charset=utf-8", extension: "csv" };
    case "xlsx": return { body: await createExcel(report), contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
    case "png": return { body: createDashboardPng(report), contentType: "image/png", extension: "png" };
    case "pptx": return { body: await createPresentation(report), contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: "pptx" };
    case "pdf": return { body: await createPdf(report), contentType: "application/pdf", extension: "pdf" };
  }
}

async function buildReport(filters: BiFilters) {
  const [dashboard, financials, alerts, calendar] = await Promise.all([
    biService.getDashboardOverview(filters), biService.getFinancialSummary(filters),
    biService.getActiveAlerts(filters), biService.getUpcomingCalendarEvents(filters.exploitationId),
  ]);
  return { dashboard, financials, alerts, calendar };
}

function dateLabel(report: Report) { return `${report.dashboard.period.from} au ${report.dashboard.period.to}`; }
function number(value: number | null | undefined) { return value == null ? "—" : String(value); }

function rawRows(report: Report) {
  return [
    ...report.dashboard.gmqTrend.map((point) => ({ section: "Croissance", periode: point.month, indicateur: "Poids moyen (kg)", valeur: point.avgWeight })),
    ...report.dashboard.gmqTrend.map((point) => ({ section: "Croissance", periode: point.month, indicateur: "GMQ (g/j)", valeur: point.gmqGramsPerDay ?? "" })),
    ...report.dashboard.herd.breedDistribution.map((row) => ({ section: "Troupeau", periode: "Actuel", indicateur: `Race - ${row.breed}`, valeur: row.count })),
    ...report.financials.monthly.map((row) => ({ section: "Finances", periode: row.month, indicateur: "Dépenses", valeur: row.totalExpenses })),
    ...report.financials.monthly.map((row) => ({ section: "Finances", periode: row.month, indicateur: "Revenus", valeur: row.totalRevenues })),
  ];
}

function createCsv(report: Report) {
  return "\uFEFF" + new Parser({ fields: ["section", "periode", "indicateur", "valeur"] }).parse(rawRows(report));
}

async function createExcel(report: Report): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart Sheep Manager";
  const summary = workbook.addWorksheet("Synthèse");
  summary.columns = [{ width: 30 }, { width: 22 }];
  summary.mergeCells("A1:B1");
  summary.getCell("A1").value = "Rapport BI — Smart Sheep Manager";
  summary.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  summary.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D32" } };
  summary.addRow(["Période", dateLabel(report)]);
  summary.addRows([
    ["Effectif total", report.dashboard.herd.totalAnimals], ["Mortalité", `${report.dashboard.mortalityRate}%`],
    ["Fertilité", `${report.dashboard.fertilityRate}%`], ["Revenus", report.financials.totalRevenues],
    ["Dépenses", report.financials.totalExpenses], ["Marge nette", report.financials.netMargin],
  ]);
  const data = workbook.addWorksheet("Données brutes");
  data.columns = [{ header: "Section", key: "section", width: 18 }, { header: "Période", key: "periode", width: 16 }, { header: "Indicateur", key: "indicateur", width: 30 }, { header: "Valeur", key: "valeur", width: 18 }];
  data.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  data.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E7D32" } };
  data.addRows(rawRows(report));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function createPdf(report: Report): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 44, info: { Title: "Rapport BI Smart Sheep" } });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const result = new Promise<Buffer>((resolve, reject) => { doc.on("end", () => resolve(Buffer.concat(chunks))); doc.on("error", reject); });
  doc.rect(0, 0, 595, 92).fill("#2E7D32");
  doc.fillColor("#FFFFFF").fontSize(22).font("Helvetica-Bold").text("Rapport de performance BI", 44, 32);
  doc.font("Helvetica").fontSize(10).text(`Période analysée : ${dateLabel(report)}`, 44, 62);
  doc.fillColor("#1B1B1B").font("Helvetica-Bold").fontSize(15).text("Indicateurs clés", 44, 118);
  const metrics = [["Effectif", `${report.dashboard.herd.totalAnimals} têtes`], ["Mortalité", `${report.dashboard.mortalityRate}%`], ["Fertilité", `${report.dashboard.fertilityRate}%`], ["Marge nette", `${report.financials.netMargin.toFixed(2)}`]];
  metrics.forEach(([label, value], index) => { const x = 44 + (index % 2) * 250; const y = 150 + Math.floor(index / 2) * 55; doc.roundedRect(x, y, 225, 43, 5).fill("#F2F7F2"); doc.fillColor("#52605A").font("Helvetica").fontSize(9).text(label, x + 12, y + 8); doc.fillColor("#1B1B1B").font("Helvetica-Bold").fontSize(14).text(value, x + 12, y + 22); });
  doc.fillColor("#1B1B1B").fontSize(15).text("Répartition par race", 44, 285);
  report.dashboard.herd.breedDistribution.forEach((row, index) => { const y = 315 + index * 22; doc.font("Helvetica").fontSize(10).fillColor("#1B1B1B").text(row.breed, 44, y); doc.fillColor("#2E7D32").rect(170, y + 2, Math.min(260, row.count * 8), 11).fill(); doc.fillColor("#1B1B1B").text(String(row.count), 440, y); });
  doc.fillColor("#1B1B1B").font("Helvetica-Bold").fontSize(15).text("Synthèse financière", 44, 430);
  doc.font("Helvetica").fontSize(10).text(`Revenus : ${number(report.financials.totalRevenues)}   •   Dépenses : ${number(report.financials.totalExpenses)}   •   Marge : ${number(report.financials.netMargin)}`, 44, 458);
  doc.fillColor("#6B6B6B").fontSize(8).text(`Généré le ${new Date().toLocaleDateString("fr-FR")} — Smart Sheep Manager`, 44, 780);
  doc.end(); return result;
}

async function createPresentation(report: Report): Promise<Buffer> {
  const pptx = new (pptxgen as unknown as new () => any)(); pptx.layout = "LAYOUT_WIDE"; pptx.author = "Smart Sheep Manager"; pptx.subject = "Rapport BI";
  const title = pptx.addSlide(); title.background = { color: "F5F7F5" }; title.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 1.3, fill: { color: "2E7D32" }, line: { color: "2E7D32" } }); title.addText("Rapport de performance BI", { x: .6, y: .4, w: 9, h: .4, fontFace: "Aptos Display", fontSize: 26, bold: true, color: "FFFFFF" }); title.addText(`Période analysée : ${dateLabel(report)}`, { x: .65, y: 2.2, w: 7, h: .3, fontSize: 16, color: "334155" });
  const metrics = pptx.addSlide(); metrics.addText("Indicateurs clés", { x: .6, y: .45, w: 6, h: .4, fontSize: 24, bold: true, color: "1B1B1B" }); [["Effectif", `${report.dashboard.herd.totalAnimals} têtes`], ["Mortalité", `${report.dashboard.mortalityRate}%`], ["Fertilité", `${report.dashboard.fertilityRate}%`], ["Marge nette", number(report.financials.netMargin)]].forEach(([label, value], index) => { const x=.65+(index%2)*3.1, y=1.35+Math.floor(index/2)*1.55; metrics.addShape(pptx.ShapeType.roundRect,{x,y,w:2.7,h:1.15,rectRadius:.08,fill:{color:"EDF7EE"},line:{color:"CBE6CE"}}); metrics.addText(label,{x:x+.18,y:y+.2,w:2,h:.2,fontSize:12,color:"52605A"}); metrics.addText(value,{x:x+.18,y:y+.52,w:2.3,h:.3,fontSize:21,bold:true,color:"1B1B1B"}); });
  const financial = pptx.addSlide(); financial.addText("Évolution financière", { x: .6, y: .45, w: 7, h: .4, fontSize: 24, bold: true, color: "1B1B1B" }); financial.addChart(pptx.ChartType.bar, [{ name: "Revenus", labels: report.financials.monthly.map((r) => r.month), values: report.financials.monthly.map((r) => r.totalRevenues) }, { name: "Dépenses", labels: report.financials.monthly.map((r) => r.month), values: report.financials.monthly.map((r) => r.totalExpenses) }], { x: .7, y: 1.15, w: 11.5, h: 5.2, catAxisLabelFontSize: 9, valAxisLabelFontSize: 9, showLegend: true, showTitle: false, chartColors: ["2E7D32", "C62828"] });
  return Buffer.from(await pptx.write({ outputType: "nodebuffer" }));
}

function createDashboardPng(report: Report): Buffer {
  const width = 1200, height = 675, pixels = Buffer.alloc(width * height * 4, 255);
  const set = (x: number, y: number, r: number, g: number, b: number) => { if (x < 0 || y < 0 || x >= width || y >= height) return; const i = (y * width + x) * 4; pixels[i] = r; pixels[i + 1] = g; pixels[i + 2] = b; pixels[i + 3] = 255; };
  const rect = (x: number, y: number, w: number, h: number, color: [number, number, number]) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, ...color); };
  rect(0, 0, width, 88, [46, 125, 50]); rect(50, 125, 1100, 3, [210, 220, 212]);
  const data = report.dashboard.herd.breedDistribution.slice(0, 8); const max = Math.max(1, ...data.map((x) => x.count)); const barWidth = Math.max(45, Math.floor(820 / Math.max(1, data.length)));
  data.forEach((row, i) => { const h = Math.round((row.count / max) * 350); rect(180 + i * (barWidth + 30), 555 - h, barWidth, h, [46, 125, 50]); });
  // Minimal visual report: header + chart + KPI color blocks. The filename and surrounding app UI provide full labels.
  [[55, 160], [55, 260], [55, 360]].forEach(([x, y], index) => rect(x, y, 80 + index * 25, 46, index === 1 ? [198, 40, 40] : [46, 125, 50]));
  return pngEncode(width, height, pixels);
}

function pngEncode(width: number, height: number, rgba: Buffer): Buffer {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 4 + 1)] = 0; rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4); }
  const chunk = (type: string, data: Buffer) => { const typeBuffer = Buffer.from(type); const crc = crc32(Buffer.concat([typeBuffer, data])); const out = Buffer.alloc(12 + data.length); out.writeUInt32BE(data.length, 0); typeBuffer.copy(out, 4); data.copy(out, 8); out.writeUInt32BE(crc >>> 0, 8 + data.length); return out; };
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
function crc32(data: Buffer) { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return crc ^ 0xffffffff; }
