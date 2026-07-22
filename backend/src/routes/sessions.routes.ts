import { Hono } from "hono";
import { db } from "../db/connection.js";
import { userSessions, users } from "../db/schema/index.js";
import { eq, or, like, desc } from "drizzle-orm";
import { sessionExportService } from "../services/session-export.service.js";

const sessionsRoutes = new Hono();

sessionsRoutes.get("/", async (c) => {
  try {
    const page = Number(c.req.query("page") ?? "1");
    const limit = Number(c.req.query("limit") ?? "20");
    const search = c.req.query("search");

    let query = db
      .select({
        id: userSessions.id,
        userId: userSessions.userId,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        ip: userSessions.ip,
        userAgent: userSessions.userAgent,
        loginAt: userSessions.loginAt,
        logoutAt: userSessions.logoutAt,
        isActive: userSessions.isActive,
      })
      .from(userSessions)
      .leftJoin(users, eq(userSessions.userId, users.id))
      .$dynamic();

    if (search) {
      const term = `%${search}%`;
      query = query.where(
        or(
          like(userSessions.ip, term),
          like(userSessions.userAgent, term),
          like(users.firstName, term),
          like(users.lastName, term),
          like(users.email, term)
        )
      );
    }

    const sessions = await query
      .orderBy(desc(userSessions.loginAt))
      .limit(limit)
      .offset((page - 1) * limit);
    console.log("Nombre de sessions :", sessions.length);
    console.log(sessions);
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
    const csv = await sessionExportService.exportCsv();
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
    const pdf = await sessionExportService.exportPdf();
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", "attachment; filename=sessions.pdf");
    return c.body(new Uint8Array(pdf));
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "Erreur export PDF" }, 500);
  }
});

export default sessionsRoutes;