// mobile/src/services/reportService.ts

import api from './api';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print'; // ✅ Static import – works in Expo

export interface PnLReport {
  period: { startDate: string; endDate: string };
  revenues: { category: string; total: number }[];
  expenses: { category: string; total: number }[];
  totalRevenues: number;
  totalExpenses: number;
  netProfit: number;
  revenueTotal: number;
  expenseTotal: number;
}

export async function getPnLReport(startDate: string, endDate: string): Promise<{ success: boolean; data?: PnLReport; message?: string }> {
  try {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get(`/reports/pnl?${params.toString()}`);
    return { success: true, data: response.data.data };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Erreur lors du chargement du rapport' };
  }
}

export async function exportPnL(
  startDate: string,
  endDate: string,
  format: 'csv' | 'fec'
): Promise<{ success: boolean; data?: string; message?: string }> {
  try {
    const params = new URLSearchParams({ startDate, endDate, format });
    const response = await api.get(`/reports/pnl/export?${params.toString()}`, {
      responseType: 'text',
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || 'Erreur lors de l\'export' };
  }
}

/**
 * Generate a PDF report from P&L data using expo-print.
 */
export async function generatePdfReport(report: PnLReport): Promise<{ success: boolean; uri?: string; message?: string }> {
  try {
    // Build HTML content
    const periodLabel = `${new Date(report.period.startDate).toLocaleDateString('fr-FR')} – ${new Date(report.period.endDate).toLocaleDateString('fr-FR')}`;

    const revenueRows = report.revenues.map(r => `
      <tr>
        <td>${r.category}</td>
        <td style="text-align:right">${r.total.toFixed(2)} MAD</td>
      </tr>
    `).join('');

    const expenseRows = report.expenses.map(e => `
      <tr>
        <td>${e.category}</td>
        <td style="text-align:right">${e.total.toFixed(2)} MAD</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #14532d; text-align: center; }
            .period { text-align: center; margin-bottom: 20px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th { background-color: #14532d; color: white; padding: 8px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .total-row { font-weight: bold; background-color: #f0f0f0; }
            .grand-total { font-size: 18px; margin-top: 20px; padding: 10px; background-color: #e8f5e9; border-radius: 8px; }
          </style>
        </head>
        <body>
          <h1>Rapport financier</h1>
          <div class="period">Période : ${periodLabel}</div>

          <h2>Revenus</h2>
          <table>
            <thead><tr><th>Catégorie</th><th>Montant</th></tr></thead>
            <tbody>
              ${revenueRows}
              <tr class="total-row"><td>Total Revenus</td><td style="text-align:right">${report.totalRevenues.toFixed(2)} MAD</td></tr>
            </tbody>
          </table>

          <h2>Dépenses</h2>
          <table>
            <thead><tr><th>Catégorie</th><th>Montant</th></tr></thead>
            <tbody>
              ${expenseRows}
              <tr class="total-row"><td>Total Dépenses</td><td style="text-align:right">${report.totalExpenses.toFixed(2)} MAD</td></tr>
            </tbody>
          </table>

          <div class="grand-total">
            <strong>Résultat net :</strong> ${report.netProfit.toFixed(2)} MAD
          </div>
        </body>
      </html>
    `;

    // ✅ Use static Print.printToFileAsync
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Save to permanent location and share
    const fileName = `rapport_${Date.now()}.pdf`;
    const fileUri = FileSystem.documentDirectory + fileName;
    await FileSystem.copyAsync({
      from: uri,
      to: fileUri,
    });
    await Sharing.shareAsync(fileUri);

    return { success: true, uri: fileUri };
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return { success: false, message: 'Erreur lors de la génération du PDF. Veuillez utiliser CSV ou FEC.' };
  }
}