/**
 * Builds downloadable payroll report content. Pure functions only.
 */

// Cells starting with these characters can run as formulas in spreadsheets.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  let text = String(value);
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (header, rows) =>
  [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');

const REPORT_HEADER = [
  'Pay period start',
  'Pay period end',
  'Basic salary',
  'Allowances',
  'Gross pay',
  'Total deductions',
  'Net pay',
  'Deduction rate (%)',
  'Net change vs previous',
  'Currency',
];

/** Rows for the payroll CSV from salary trend points. */
export const buildPayrollCsv = (trend, deductionRateFn) =>
  toCsv(
    REPORT_HEADER,
    trend.map((p) => [
      p.periodStart,
      p.periodEnd,
      p.basicSalary,
      p.totalAllowances,
      p.grossPay,
      p.totalDeductions,
      p.netPay,
      deductionRateFn(p),
      p.changeNet,
      p.currency,
    ]),
  );

export const REPORT_DISCLAIMER =
  'Figures are calculated from payroll values you confirmed or corrected. ' +
  'This report is informational and is not legal or payroll advice. ' +
  'Ask your HR department to clarify any entry you are unsure about.';

export const buildReportFilename = (now = new Date()) =>
  `earnest-payroll-report-${now.toISOString().slice(0, 10)}.csv`;
