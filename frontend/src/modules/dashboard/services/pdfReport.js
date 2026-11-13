import { buildChartGeometry, formatDate } from '../lib/format.js';

// Builds the payroll PDF with jsPDF's built-in fonts. Those fonts have no peso sign or typographic dashes, so amounts print as "PHP 1,234.50" and missing values as "-".

const PAGE = { w: 595.28, h: 841.89, m: 40 };
const CONTENT_W = PAGE.w - PAGE.m * 2;
const COLOR = {
  brand: [30, 64, 175],
  text: [30, 41, 59],
  muted: [100, 116, 139],
  line: [226, 232, 240],
  soft: [241, 245, 249],
  zebra: [248, 250, 252],
  good: [22, 163, 74],
  bad: [220, 38, 38],
  warn: [217, 119, 6],
};

export const pdfMoney = (value, currency = 'PHP') =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? '-'
    : `${currency} ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const pdfPct = (v) => (v === null || v === undefined ? '-' : `${Number(v).toFixed(1)}%`);
const rangeText = (range) =>
  range?.from || range?.to
    ? `${range.from ? formatDate(range.from) : 'Start'} to ${range.to ? formatDate(range.to) : 'Today'}`
    : 'All dates';

export function buildPdf(report, JsPDF) {
  const doc = new JsPDF({ unit: 'pt', format: 'a4' });
  const s = report.summary;
  const cur = s.currency || 'PHP';
  const fill = (c) => doc.setFillColor(...c);
  const ink = (c) => doc.setTextColor(...c);
  const stroke = (c) => doc.setDrawColor(...c);
  const font = (size, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
  };

  let y = 0;
  const FOOTER_H = 52;
  const ensure = (needed) => {
    if (y + needed > PAGE.h - FOOTER_H) {
      doc.addPage();
      y = PAGE.m;
      return true;
    }
    return false;
  };
  const sectionTitle = (text) => {
    ensure(40);
    font(12, true);
    ink(COLOR.brand);
    doc.text(text, PAGE.m, y);
    stroke(COLOR.brand);
    doc.setLineWidth(1.2);
    doc.line(PAGE.m, y + 5, PAGE.m + 28, y + 5);
    y += 22;
  };

  // ---- Header band ----
  fill(COLOR.brand);
  doc.rect(0, 0, PAGE.w, 96, 'F');
  ink([255, 255, 255]);
  font(22, true);
  doc.text('Earnest', PAGE.m, 44);
  font(11);
  doc.text('Payroll Report', PAGE.m, 62);
  font(9);
  doc.text(`Generated ${formatDate(report.generatedAt)}   |   Period: ${rangeText(report.range)}`, PAGE.m, 80);
  y = 124;

  // ---- Summary cards ----
  const cards = [
    ['Latest net pay', pdfMoney(s.latest?.netPay, cur)],
    ['Average net pay', pdfMoney(s.averageNetPay, cur)],
    ['Average gross pay', pdfMoney(s.averageGrossPay, cur)],
    ['Avg deduction rate', pdfPct(s.averageDeductionRatePct)],
  ];
  const gap = 10;
  const cw = (CONTENT_W - gap * 3) / 4;
  cards.forEach(([label, value], i) => {
    const x = PAGE.m + i * (cw + gap);
    fill(COLOR.soft);
    doc.roundedRect(x, y, cw, 54, 5, 5, 'F');
    font(8);
    ink(COLOR.muted);
    doc.text(label, x + 9, y + 18);
    font(value.length > 14 ? 10 : 12, true);
    ink(COLOR.text);
    doc.text(value, x + 9, y + 40);
  });
  y += 54 + 8;
  font(8);
  ink(COLOR.muted);
  doc.text(
    `${s.recordCount} pay period${s.recordCount === 1 ? '' : 's'}   |   Highest net ${pdfMoney(s.highestNetPay, cur)}   |   Lowest net ${pdfMoney(s.lowestNetPay, cur)}`,
    PAGE.m,
    y + 6,
  );
  y += 32;

  // ---- Net pay chart ----
  const geo = buildChartGeometry(report.points, { width: CONTENT_W, height: 130, padding: 22 });
  if (geo.points.length > 0) {
    sectionTitle('Net pay trend');
    const top = y;
    fill(COLOR.zebra);
    stroke(COLOR.line);
    doc.setLineWidth(0.6);
    doc.roundedRect(PAGE.m, top, CONTENT_W, 130, 5, 5, 'FD');
    stroke(COLOR.brand);
    doc.setLineWidth(1.6);
    geo.points.forEach((p, i) => {
      if (i > 0) {
        const q = geo.points[i - 1];
        doc.line(PAGE.m + q.x, top + q.y, PAGE.m + p.x, top + p.y);
      }
    });
    fill(COLOR.brand);
    geo.points.forEach((p) => doc.circle(PAGE.m + p.x, top + p.y, 2.6, 'F'));
    font(7.5);
    ink(COLOR.muted);
    doc.text(pdfMoney(geo.max, cur), PAGE.m + 6, top + 11);
    doc.text(pdfMoney(geo.min, cur), PAGE.m + 6, top + 125);
    y = top + 130 + 8;
    font(8);
    doc.text(formatDate(geo.points[0].date), PAGE.m, y + 4);
    if (geo.points.length > 1) {
      doc.text(formatDate(geo.points[geo.points.length - 1].date), PAGE.m + CONTENT_W, y + 4, { align: 'right' });
    }
    y += 28;
  }

  // ---- Pay history table ----
  sectionTitle('Pay history');
  const cols = [
    { h: 'Pay period', w: 118, align: 'left' },
    { h: 'Basic', w: 62, align: 'right' },
    { h: 'Allow.', w: 58, align: 'right' },
    { h: 'Gross', w: 66, align: 'right' },
    { h: 'Deduct.', w: 62, align: 'right' },
    { h: 'Net pay', w: 68, align: 'right' },
    { h: 'Change', w: 41, align: 'right' },
  ];
  const scale = CONTENT_W / cols.reduce((a, c) => a + c.w, 0);
  cols.forEach((c) => (c.w *= scale));
  const cellX = (i, align) => {
    const left = PAGE.m + cols.slice(0, i).reduce((a, c) => a + c.w, 0);
    return align === 'right' ? left + cols[i].w - 6 : left + 6;
  };
  const num = (v) => (v === null || v === undefined ? '-' : Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const header = () => {
    fill(COLOR.brand);
    doc.rect(PAGE.m, y, CONTENT_W, 20, 'F');
    font(8, true);
    ink([255, 255, 255]);
    cols.forEach((c, i) => doc.text(c.h, cellX(i, c.align), y + 13.5, { align: c.align }));
    y += 20;
  };

  if (!report.points.length) {
    font(10);
    ink(COLOR.muted);
    doc.text('No payroll records in this range.', PAGE.m, y + 6);
    y += 24;
  } else {
    header();
    let flagged = false;
    report.points.forEach((p, i) => {
      if (ensure(22)) header();
      if (i % 2 === 0) {
        fill(COLOR.zebra);
        doc.rect(PAGE.m, y, CONTENT_W, 20, 'F');
      }
      const needsReview = p.analysisStatus === 'needs_review';
      flagged = flagged || needsReview;
      const period = p.periodStart && p.periodEnd
        ? `${formatDate(p.periodStart)} - ${formatDate(p.periodEnd)}`
        : formatDate(p.date);
      font(8);
      ink(COLOR.text);
      doc.text(`${period}${needsReview ? ' *' : ''}`, cellX(0, 'left'), y + 13.5);
      [p.basicSalary, p.totalAllowances, p.grossPay, p.totalDeductions].forEach((v, k) =>
        doc.text(num(v), cellX(k + 1, 'right'), y + 13.5, { align: 'right' }),
      );
      font(8, true);
      doc.text(num(p.netPay), cellX(5, 'right'), y + 13.5, { align: 'right' });
      font(8);
      ink(p.changePct > 0 ? COLOR.good : p.changePct < 0 ? COLOR.bad : COLOR.muted);
      doc.text(
        p.changePct === null || p.changePct === undefined ? '-' : `${p.changePct > 0 ? '+' : ''}${p.changePct.toFixed(1)}%`,
        cellX(6, 'right'),
        y + 13.5,
        { align: 'right' },
      );
      y += 20;
    });
    stroke(COLOR.line);
    doc.setLineWidth(0.6);
    doc.line(PAGE.m, y, PAGE.m + CONTENT_W, y);
    y += 12;
    font(7.5);
    ink(COLOR.muted);
    doc.text(`All amounts in ${cur}.${flagged ? '  * This period is marked "needs review".' : ''}`, PAGE.m, y);
    y += 22;
  }

  // ---- Deductions by type ----
  if (report.deductionBreakdown.length) {
    sectionTitle('Deductions by type');
    report.deductionBreakdown.forEach((d) => {
      ensure(30);
      font(9, true);
      ink(COLOR.text);
      doc.text(d.name, PAGE.m, y + 8);
      font(9);
      doc.text(`${pdfMoney(d.total, cur)}  (${pdfPct(d.sharePct)})`, PAGE.m + CONTENT_W, y + 8, { align: 'right' });
      fill(COLOR.soft);
      doc.roundedRect(PAGE.m, y + 14, CONTENT_W, 6, 3, 3, 'F');
      fill(COLOR.brand);
      doc.roundedRect(PAGE.m, y + 14, Math.max(6, (CONTENT_W * Math.min(100, d.sharePct)) / 100), 6, 3, 3, 'F');
      y += 30;
    });
  }

  // ---- Footer on every page ----
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    stroke(COLOR.line);
    doc.setLineWidth(0.6);
    doc.line(PAGE.m, PAGE.h - 46, PAGE.w - PAGE.m, PAGE.h - 46);
    font(7);
    ink(COLOR.muted);
    doc.text(doc.splitTextToSize(report.disclaimer, CONTENT_W - 60), PAGE.m, PAGE.h - 34);
    doc.text(`Page ${i} of ${pages}`, PAGE.w - PAGE.m, PAGE.h - 34, { align: 'right' });
  }

  return doc;
}
