import { Hono } from "hono";
import { sessionExportService } from "../services/session-export.service.js";
import { findAllSessions } from "../repositories/sessions.repository.js";

const sessionsRoutes = new Hono();

sessionsRoutes.get("/", async (c) => {
  try {
    const page = Number(c.req.query("page") ?? "1");
    const limit = Number(c.req.query("limit") ?? "20");
    const search = c.req.query("search") ?? undefined;

    const sessions = await findAllSessions(page, limit, search);

    return c.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Erreur récupération sessions",
      },
      500
    );
  }
});

// Export CSV
sessionsRoutes.get("/export/csv", async (c) => {
  try {
    const page = Number(c.req.query("page") ?? "1");
    const limit = Number(c.req.query("limit") ?? "20");
    const search = c.req.query("search") ?? undefined;
    const csv = await sessionExportService.exportCsv(page, limit, search);
    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", "attachment; filename=sessions.csv");
    return c.body(csv);
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Erreur export CSV" }, 500);
  }
});

// Export PDF
sessionsRoutes.get("/export/pdf", async (c) => {
  try {
    const page = Number(c.req.query("page") ?? "1");
    const limit = Number(c.req.query("limit") ?? "20");
    const search = c.req.query("search") ?? undefined;
    const pdf = await sessionExportService.exportPdf(page, limit, search);
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", "attachment; filename=sessions.pdf");
    return c.body(new Uint8Array(pdf));
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Erreur export PDF" }, 500);
  }
});

export default sessionsRoutes;
