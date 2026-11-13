import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsPDF } from 'jspdf';
import { buildPdf, pdfMoney } from '../services/pdfReport.js';

const point = (i, over = {}) => ({
  id: `r${i}`,
  date: `2026-0${(i % 9) + 1}-15`,
  periodStart: `2026-0${(i % 9) + 1}-01`,
  periodEnd: `2026-0${(i % 9) + 1}-15`,
  basicSalary: 20000,
  totalAllowances: 1500,
  grossPay: 21500,
  totalDeductions: 2500,
  netPay: 19000 + i * 100,
  currency: 'PHP',
  changePct: i === 0 ? null : 0.5,
  analysisStatus: 'completed',
  ...over,
});

const report = (points, deductionBreakdown = []) => ({
  generatedAt: '2026-04-01T00:00:00Z',
  range: { from: null, to: null },
  filename: 'x.csv',
  disclaimer: 'Informational only.',
  summary: {
    currency: 'PHP',
    recordCount: points.length,
    latest: points[points.length - 1] || null,
    averageNetPay: 19500,
    averageGrossPay: 21500,
    averageDeductionRatePct: 11.6,
    highestNetPay: 20000,
    lowestNetPay: 19000,
  },
  deductionBreakdown,
  points,
});

test('pdfMoney avoids glyphs the built-in font cannot draw', () => {
  assert.equal(pdfMoney(1234.5), 'PHP 1,234.50');
  assert.equal(pdfMoney(null), '-');
});

test('builds a one page PDF for a normal report', () => {
  const pts = [point(0), point(1), point(2, { analysisStatus: 'needs_review' })];
  const doc = buildPdf(report(pts, [{ name: 'SSS', total: 900, sharePct: 36 }]), jsPDF);
  assert.equal(doc.getNumberOfPages(), 1);
  assert.ok(doc.output('arraybuffer').byteLength > 1000);
});

test('draws the logo in the header when provided', async () => {
  const { readFileSync } = await import('node:fs');
  const png = readFileSync(new URL('../../../assets/logo.png', import.meta.url)).toString('base64');
  const doc = buildPdf(report([point(0)]), jsPDF, { logo: `data:image/png;base64,${png}` });
  assert.equal(doc.getNumberOfPages(), 1);
  assert.ok(doc.output().includes('/Subtype /Image'));
});

test('empty report still builds', () => {
  assert.equal(buildPdf(report([]), jsPDF).getNumberOfPages(), 1);
});

test('a long history paginates', () => {
  const pts = Array.from({ length: 60 }, (_, i) => point(i));
  assert.ok(buildPdf(report(pts), jsPDF).getNumberOfPages() >= 2);
});
