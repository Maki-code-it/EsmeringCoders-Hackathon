import { downloadTextFile } from '../lib/format.js';

/** Download the CSV produced by the backend report endpoint. */
export const exportCsv = (report) => downloadTextFile(report.filename, report.csv);

// Build and download the PDF report. jsPDF (already a project dependency) and the layout code load on demand so they do not slow the dashboard's first paint.
export const exportPdf = async (report) => {
  const [{ jsPDF }, { buildPdf }] = await Promise.all([import('jspdf'), import('./pdfReport.js')]);
  buildPdf(report, jsPDF).save(report.filename.replace(/\.csv$/, '.pdf'));
};
