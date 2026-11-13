import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBreakdown, DEDUCTION_CATEGORIES, EARNING_CATEGORIES } from '../../../../../backend/src/modules/payroll/calculator.js';
import { CATEGORY_MEANINGS, explainBreakdown } from '../lib/breakdownExplanations.js';

const sample = () =>
  calculateBreakdown({
    earnings: [
      { category: 'basic', description: 'Basic pay', amount: 9000 },
      { category: 'overtime', description: 'Overtime (6 hrs)', amount: 562.5 },
      { category: 'allowance', description: 'Rice allowance', amount: 1000 },
    ],
    deductions: [
      { category: 'sss', description: 'SSS contribution', amount: 450 },
      { category: 'philhealth', description: 'PhilHealth contribution', amount: 250 },
      { category: 'pagibig', description: 'Pag-IBIG contribution', amount: 100 },
      { category: 'other', description: 'Uniform', amount: 200 },
    ],
    statedNetPay: 9562.5,
    payPeriodStart: '2026-11-01',
    payPeriodEnd: '2026-11-15',
  });

test('every calculator category has a plain-language meaning', () => {
  for (const category of [...Object.keys(EARNING_CATEGORIES), ...Object.keys(DEDUCTION_CATEGORIES)]) {
    assert.ok(CATEGORY_MEANINGS[category], `missing meaning for ${category}`);
  }
});

test('summary states gross, deductions, take-home and percentages', () => {
  const { summary } = explainBreakdown(sample());
  for (const part of ['10,562.50', '1,000.00', '9,562.50', '9.5%', '90.5%']) {
    assert.ok(summary.includes(part), `summary missing ${part}: ${summary}`);
  }
});

test('one explanation per line, in order, with amount and share of gross', () => {
  const explained = explainBreakdown(sample());
  assert.deepEqual(explained.earnings.map((l) => l.label), ['Basic pay', 'Overtime (6 hrs)', 'Rice allowance']);
  assert.deepEqual(explained.deductions.map((l) => l.label), ['SSS contribution', 'PhilHealth contribution', 'Pag-IBIG contribution', 'Uniform']);
  assert.equal(explained.earnings[0].share, ' (85.2% of gross)');
  assert.ok(explained.earnings[0].amount.includes('9,000.00'));
  assert.equal(explained.deductions[3].meaning, CATEGORY_MEANINGS.other);
  assert.equal(explained.totals.length, 3);
});

test('empty payslip gets a friendly summary and no line explanations', () => {
  const explained = explainBreakdown(calculateBreakdown({}));
  assert.match(explained.summary, /No earnings/);
  assert.equal(explained.earnings.length, 0);
  assert.equal(explained.deductions.length, 0);
});
