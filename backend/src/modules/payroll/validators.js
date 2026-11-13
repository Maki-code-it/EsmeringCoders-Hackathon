import { DEDUCTION_CATEGORIES, EARNING_CATEGORIES } from './calculator.js';

// Validators shaped for the shared validateRequest middleware (return { field: message }; empty object = valid). Messages never echo values.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LINES = 20;
const MAX_AMOUNT = 10_000_000;

const isRealDate = (value) => {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const isEmpty = (value) => value === undefined || value === null || value === '';

/** Money: a number from 0 to 10,000,000 with at most 2 decimal places. */
const isValidAmount = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= MAX_AMOUNT &&
  Math.abs(Math.round(value * 100) - value * 100) < 1e-6;

const validateLines = (lines, categories, field, errors) => {
  if (!Array.isArray(lines)) {
    errors[field] = `${field} must be a list`;
    return;
  }
  if (lines.length > MAX_LINES) {
    errors[field] = `Enter at most ${MAX_LINES} ${field}`;
    return;
  }
  lines.forEach((line, index) => {
    if (!line || typeof line !== 'object') {
      errors[`${field}[${index}]`] = 'Invalid line';
      return;
    }
    if (!Object.hasOwn(categories, line.category)) {
      errors[`${field}[${index}].category`] = 'Choose a valid category';
    }
    if (!isEmpty(line.description) && (typeof line.description !== 'string' || line.description.length > 80)) {
      errors[`${field}[${index}].description`] = 'Description must be 80 characters or fewer';
    }
    if (!isValidAmount(line.amount)) {
      errors[`${field}[${index}].amount`] = 'Enter an amount from 0 to 10,000,000 (max 2 decimals)';
    }
  });
};

export const validatePayslipBody = (req) => {
  const errors = {};
  const body = req.body || {};
  const earnings = body.earnings ?? [];
  const deductions = body.deductions ?? [];

  validateLines(earnings, EARNING_CATEGORIES, 'earnings', errors);
  validateLines(deductions, DEDUCTION_CATEGORIES, 'deductions', errors);

  if (Array.isArray(earnings) && !earnings.some((line) => isValidAmount(line?.amount) && line.amount > 0)) {
    errors.earnings = errors.earnings || 'Enter at least one earning with an amount above 0';
  }

  if (!isEmpty(body.employerName) && (typeof body.employerName !== 'string' || body.employerName.length > 120)) {
    errors.employerName = 'Employer name must be 120 characters or fewer';
  }

  for (const field of ['payPeriodStart', 'payPeriodEnd', 'paymentDate']) {
    if (!isEmpty(body[field]) && !isRealDate(body[field])) errors[field] = 'Use a valid date (YYYY-MM-DD)';
  }
  if (!errors.payPeriodStart && !errors.payPeriodEnd && body.payPeriodStart && body.payPeriodEnd && body.payPeriodStart > body.payPeriodEnd) {
    errors.payPeriodEnd = 'Pay period end must be on or after the start';
  }

  if (!isEmpty(body.documentId) && !UUID.test(String(body.documentId))) {
    errors.documentId = 'Invalid document id';
  }

  if (!isEmpty(body.statedNetPay) && !isValidAmount(body.statedNetPay)) {
    errors.statedNetPay = 'Enter an amount from 0 to 10,000,000 (max 2 decimals)';
  }

  return errors;
};

export const validateRecordId = (req) =>
  UUID.test(String(req.params.id || '')) ? {} : { id: 'Invalid record id' };

/** Normalized payslip input (blank strings become null). */
export const parsePayslipBody = (body = {}) => ({
  documentId: isEmpty(body.documentId) ? null : String(body.documentId),
  employerName: isEmpty(body.employerName) ? null : body.employerName.trim(),
  payPeriodStart: body.payPeriodStart || null,
  payPeriodEnd: body.payPeriodEnd || null,
  paymentDate: body.paymentDate || null,
  statedNetPay: isEmpty(body.statedNetPay) ? null : body.statedNetPay,
  earnings: body.earnings || [],
  deductions: body.deductions || [],
});
