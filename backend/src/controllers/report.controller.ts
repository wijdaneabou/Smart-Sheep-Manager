// backend/src/controllers/report.controller.ts

import { Context } from 'hono';
import { ReportService } from '../services/report.service.js';
import { reportQuerySchema, reportExportQuerySchema } from '../validators/report.validator.js';

const reportService = new ReportService();

export const ReportController = {
  async getPnL(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const query = c.req.query();
    const result = reportQuerySchema.safeParse(query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return c.json({ success: false, message: 'Paramètres invalides', errors }, 400);
    }

    const { startDate, endDate } = result.data;
    try {
      const report = await reportService.getPnL(user.id, user.roleName || '', new Date(startDate), new Date(endDate));
      return c.json({ success: true, data: report });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },

  async exportPnL(c: Context) {
    const user = c.get('user') as { id: number; roleName?: string };
    if (!user) return c.json({ success: false, message: 'Non authentifié' }, 401);

    const query = c.req.query();
    const result = reportExportQuerySchema.safeParse(query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return c.json({ success: false, message: 'Paramètres invalides', errors }, 400);
    }

    const { startDate, endDate, format } = result.data;
    try {
      const report = await reportService.getPnL(user.id, user.roleName || '', new Date(startDate), new Date(endDate));
      let content = '';
      let mimeType = 'text/csv';
      let filename = `pnl_${startDate}_${endDate}`;
      if (format === 'csv') {
        content = reportService.generatePnLCSV(report);
        mimeType = 'text/csv';
        filename += '.csv';
      } else if (format === 'fec') {
        content = reportService.generateFEC(report, new Date(startDate), new Date(endDate));
        mimeType = 'text/csv';
        filename += '_fec.csv';
      } else {
        return c.json({ success: false, message: 'Format non supporté' }, 400);
      }

      return new Response(content, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } catch (error: any) {
      return c.json({ success: false, message: error.message || 'Erreur serveur' }, 500);
    }
  },
};