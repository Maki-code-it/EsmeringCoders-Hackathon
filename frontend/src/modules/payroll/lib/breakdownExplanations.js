// Plain-language meaning of each breakdown line. Fixed, reviewed wording (not AI); rates are deliberately not stated because they change.
import { formatMoney, formatPercent } from './payslipForm.js';

export const CATEGORY_MEANINGS = {
  // Earnings
  basic: 'Your fixed pay for regular working time, before anything is added or taken away.',
  overtime: 'Extra pay for work beyond 8 hours a day. It is paid at a higher rate than regular hours.',
  holiday: 'Pay for regular or special holidays. Working on a holiday usually earns a premium.',
  night_differential: 'Extra pay for work between 10:00 PM and 6:00 AM.',
  allowance: 'Extra pay for a specific purpose, such as rice, transport or meals. It is added on top of basic pay.',
  other_earning: 'Another amount added to your pay, such as a bonus, incentive or adjustment. Ask HR if it is unclear.',
  // Deductions
  sss: 'Your share of Social Security System contributions. It builds retirement, sickness, maternity and disability benefits.',
  philhealth: 'Your share of PhilHealth premiums. It helps pay hospital and medical bills.',
  pagibig: 'Your Pag-IBIG (HDMF) savings contribution. It also makes you eligible for housing and other loans.',
  withholding_tax: 'Income tax your employer takes out and pays to the BIR for you. Minimum-wage earners are exempt.',
  loan: 'An installment on a loan (for example SSS, Pag-IBIG or company loan) taken from your pay.',
  other: 'A deduction that is not a standard government contribution. You may ask HR what it is for and whether you agreed to it.',
};

const share = (line) => (line.percentOfGross === null || line.percentOfGross === undefined ? '' : ` (${formatPercent(line.percentOfGross)} of gross)`);

const describeLine = (line) => ({
  label: line.description,
  amount: formatMoney(line.amount),
  share: share(line),
  meaning: CATEGORY_MEANINGS[line.category] || 'An amount listed on your payslip.',
});

// One-sentence overview of the whole payslip.
export const summarizeBreakdown = ({ totals }) => {
  if (!totals.grossPay) return 'No earnings were entered yet, so there is nothing to break down.';
  return `You earned ${formatMoney(totals.grossPay)} this period. ${formatMoney(totals.totalDeductions)} (${formatPercent(totals.deductionPercent)}) was deducted, so you take home ${formatMoney(totals.computedNetPay)}, or ${formatPercent(totals.takeHomePercent)} of what you earned.`;
};

// Explanations for every earning and deduction line, plus the three totals.
export const explainBreakdown = ({ earnings, deductions, totals }) => ({
  summary: summarizeBreakdown({ totals }),
  earnings: earnings.map(describeLine),
  deductions: deductions.map(describeLine),
  totals: [
    { label: 'Gross pay', amount: formatMoney(totals.grossPay), meaning: 'Everything you earned this period: all earning lines added together.' },
    { label: 'Total deductions', amount: formatMoney(totals.totalDeductions), meaning: 'Everything taken out of your pay: all deduction lines added together.' },
    { label: 'Net pay (take-home)', amount: formatMoney(totals.computedNetPay), meaning: 'What you actually receive: gross pay minus total deductions.' },
  ],
});
