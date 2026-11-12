/**
 * Form helpers for the payroll page. Formatting and form shaping only: all
 * payroll math happens in the backend calculator (/api/payroll).
 */

// Must match backend/src/modules/payroll/calculator.js
export const EARNING_OPTIONS = [
  { value: 'basic', label: 'Basic pay' },
  { value: 'overtime', label: 'Overtime pay' },
  { value: 'holiday', label: 'Holiday pay' },
  { value: 'night_differential', label: 'Night shift differential' },
  { value: 'allowance', label: 'Allowance' },
  { value: 'other_earning', label: 'Other earning' },
];

export const DEDUCTION_OPTIONS = [
  { value: 'sss', label: 'SSS contribution' },
  { value: 'philhealth', label: 'PhilHealth contribution' },
  { value: 'pagibig', label: 'Pag-IBIG contribution' },
  { value: 'withholding_tax', label: 'Withholding tax' },
  { value: 'loan', label: 'Loan repayment' },
  { value: 'other', label: 'Other deduction' },
];

let lineKey = 0;
export const newLine = (category, description = '', amount = '') => ({
  key: `line-${(lineKey += 1)}`,
  category,
  description,
  amount: amount === '' ? '' : String(amount),
});

export const emptyForm = () => ({
  employerName: '',
  payPeriodStart: '',
  payPeriodEnd: '',
  paymentDate: '',
  statedNetPay: '',
  earnings: [newLine('basic', 'Basic pay')],
  deductions: [newLine('sss'), newLine('philhealth'), newLine('pagibig')],
});

/** Clearly fictional figures for demos. Never use a real person's payslip. */
export const sampleForm = () => ({
  employerName: 'Sample Trading Co. (sample data)',
  payPeriodStart: '2026-11-01',
  payPeriodEnd: '2026-11-15',
  paymentDate: '2026-11-15',
  statedNetPay: '9562.50',
  earnings: [
    newLine('basic', 'Basic pay', 9000),
    newLine('overtime', 'Overtime (6 hrs)', 562.5),
    newLine('allowance', 'Rice allowance', 1000),
  ],
  deductions: [
    newLine('sss', 'SSS contribution', 450),
    newLine('philhealth', 'PhilHealth contribution', 250),
    newLine('pagibig', 'Pag-IBIG contribution', 100),
    newLine('other', 'Uniform', 200),
  ],
});

const toAmount = (value) => (value === '' ? null : Number(value));

/** Shape form state into the API body. Lines with a blank amount are skipped. */
export const toPayload = (form) => {
  const lines = (list) =>
    list
      .filter((line) => line.amount !== '')
      .map((line) => ({
        category: line.category,
        description: line.description.trim(),
        amount: toAmount(line.amount),
      }));

  return {
    employerName: form.employerName.trim(),
    payPeriodStart: form.payPeriodStart,
    payPeriodEnd: form.payPeriodEnd,
    paymentDate: form.paymentDate,
    statedNetPay: toAmount(form.statedNetPay),
    earnings: lines(form.earnings),
    deductions: lines(form.deductions),
  };
};

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export const formatMoney = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value)) ? '-' : peso.format(Number(value));

export const formatPercent = (value) => (value === null || value === undefined ? '-' : `${value.toFixed(1)}%`);

const dateFormat = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

export const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? '-' : dateFormat.format(date);
};

export const formatPeriod = (start, end) =>
  start && end ? `${formatDate(start)} - ${formatDate(end)}` : 'Pay period not set';

/**
 * Turn validation details like { "earnings[0].amount": "..." } into readable
 * lines. The API index counts only filled lines, so map it back to the form row.
 */
export const describeValidation = (details, form) => {
  if (!details || typeof details !== 'object') return [];
  return Object.entries(details).map(([field, message]) => {
    const match = field.match(/^(earnings|deductions)\[(\d+)\]/);
    if (!match) return message;
    const filledRows = form[match[1]]
      .map((line, row) => (line.amount !== '' ? row : null))
      .filter((row) => row !== null);
    const row = filledRows[Number(match[2])];
    const kind = match[1] === 'earnings' ? 'Earning' : 'Deduction';
    return `${kind} row ${row === undefined ? '?' : row + 1}: ${message}`;
  });
};
