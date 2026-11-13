import logoUrl from '@/assets/logo.png';
import { downloadTextFile } from '../lib/format.js';

/** Download the CSV produced by the backend report endpoint. */
export const exportCsv = (report) => downloadTextFile(report.filename, report.csv);

// Build and download the PDF report. jsPDF (already a project dependency) and the layout code load on demand so they do not slow the dashboard's first paint.
export const exportPdf = async (report) => {
  const [{ jsPDF }, { buildPdf }, logo] = await Promise.all([import('jspdf'), import('./pdfReport.js'), loadLogo()]);
  buildPdf(report, jsPDF, { logo }).save(report.filename.replace(/\.csv$/, '.pdf'));
};

// Logo as a data URL for jsPDF; the report still downloads without it if loading fails.
const loadLogo = async () => {
  try {
    const blob = await (await fetch(logoUrl)).blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};
