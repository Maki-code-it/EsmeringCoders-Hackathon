/**
 * Payroll breakdown calculator. Pure, deterministic functions: no database, no
 * AI, no network. Every number shown as "Calculated by Earnest" comes from here.
 *
 * All math is done in whole centavos (integers) so totals never drift because
 * of floating-point rounding (e.g. 0.1 + 0.2).
 *
 * Formulas:
 *   Gross pay        = sum of all earnings
 *   Total deductions = sum of all deductions
 *   Net pay          = Gross pay - Total deductions
 *   Share of gross   = deduction amount / Gross pay x 100
 */

export const EARNING_CATEGORIES = {
  basic: 'Basic pay',
  overtime: 'Overtime pay',
  holiday: 'Holiday pay',
  night_differential: 'Night shift differential',
  allowance: 'Allowance',
  other_earning: 'Other earning',
};

export const DEDUCTION_CATEGORIES = {
  sss: 'SSS contribution',
  philhealth: 'PhilHealth contribution',
  pagibig: 'Pag-IBIG contribution',
  withholding_tax: 'Withholding tax',
  loan: 'Loan repayment',
  other: 'Other deduction',
};

// Statutory items most Philippine payslips list. Missing ones are only noted,
// because some workers are legitimately exempt (e.g. minimum-wage earners and tax).
const COMMON_STATUTORY = ['sss', 'philhealth', 'pagibig'];

// Differences up to 1 peso are treated as normal rounding on a payslip.
const NET_PAY_TOLERANCE_CENTAVOS = 100;

const toCentavos = (amount) => Math.round(Number(amount) * 100);
const toPesos = (centavos) => centavos / 100;
const sum = (lines) => lines.reduce((total, line) => total + line.centavos, 0);
const percentOf = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : null);

const normalizeLines = (lines, labels) =>
  lines.map((line) => ({
    category: line.category,
    categoryLabel: labels[line.category],
    description: String(line.description || labels[line.category]).trim(),
    centavos: toCentavos(line.amount),
  }));

/**
 * @param {object} input
 * @param {{category: string, description?: string, amount: number}[]} input.earnings
 * @param {{category: string, description?: string, amount: number}[]} input.deductions
 * @param {number|null} [input.statedNetPay]  Net pay printed on the payslip, if given.
 * @param {string|null} [input.payPeriodStart]
 * @param {string|null} [input.payPeriodEnd]
 */
export function calculateBreakdown({
  earnings = [],
  deductions = [],
  statedNetPay = null,
  payPeriodStart = null,
  payPeriodEnd = null,
}) {
  const earningLines = normalizeLines(earnings, EARNING_CATEGORIES);
  const deductionLines = normalizeLines(deductions, DEDUCTION_CATEGORIES);

  const basicCentavos = sum(earningLines.filter((line) => line.category === 'basic'));
  const grossCentavos = sum(earningLines);
  const deductionCentavos = sum(deductionLines);
  const netCentavos = grossCentavos - deductionCentavos;

  const hasStatedNet = statedNetPay !== null && statedNetPay !== undefined && statedNetPay !== '';
  const statedNetCentavos = hasStatedNet ? toCentavos(statedNetPay) : null;
  const differenceCentavos = hasStatedNet ? statedNetCentavos - netCentavos : null;

  const flags = [];

  if (hasStatedNet && Math.abs(differenceCentavos) > NET_PAY_TOLERANCE_CENTAVOS) {
    flags.push({
      code: 'NET_PAY_MISMATCH',
      severity: 'warning',
      message: `The net pay on your payslip is ${differenceCentavos > 0 ? 'higher' : 'lower'} than the computed net pay by PHP ${toPesos(Math.abs(differenceCentavos)).toFixed(2)}. A line item may be missing or mistyped. Ask HR or payroll to walk you through it.`,
    });
  }

  if (!hasStatedNet) {
    flags.push({
      code: 'NET_PAY_NOT_ENTERED',
      severity: 'info',
      message: 'Enter the net pay printed on your payslip to check it against the computed net pay.',
    });
  }

  if (deductionCentavos > grossCentavos) {
    flags.push({
      code: 'DEDUCTIONS_EXCEED_GROSS',
      severity: 'warning',
      message: 'Total deductions are larger than gross pay. Double-check the amounts you entered, then ask payroll to explain the deductions.',
    });
  }

  if (basicCentavos === 0) {
    flags.push({
      code: 'NO_BASIC_PAY',
      severity: 'info',
      message: 'No basic pay line was entered. Most payslips list basic pay separately from allowances and overtime.',
    });
  }

  for (const line of deductionLines.filter((item) => item.category === 'other')) {
    flags.push({
      code: 'UNCLEAR_DEDUCTION',
      severity: 'info',
      message: `"${line.description}" is not a standard government deduction. It is fair to ask HR what it is for and whether you agreed to it.`,
    });
  }

  const presentCategories = new Set(deductionLines.map((line) => line.category));
  const missingStatutory = COMMON_STATUTORY.filter((category) => !presentCategories.has(category));
  if (missingStatutory.length) {
    flags.push({
      code: 'STATUTORY_NOT_LISTED',
      severity: 'info',
      message: `Not listed on this payslip: ${missingStatutory.map((c) => DEDUCTION_CATEGORIES[c]).join(', ')}. This can be normal (e.g. deducted on a different cutoff), but you may ask HR to confirm.`,
    });
  }

  if (!payPeriodStart || !payPeriodEnd) {
    flags.push({
      code: 'MISSING_PAY_PERIOD',
      severity: 'info',
      message: 'The pay period is incomplete. Add it so this payslip can be compared with others in your history.',
    });
  }

  const toOutputLine = (line) => ({
    category: line.category,
    categoryLabel: line.categoryLabel,
    description: line.description,
    amount: toPesos(line.centavos),
    percentOfGross: percentOf(line.centavos, grossCentavos),
  });

  return {
    earnings: earningLines.map(toOutputLine),
    deductions: deductionLines.map(toOutputLine),
    totals: {
      basicSalary: toPesos(basicCentavos),
      totalAllowances: toPesos(grossCentavos - basicCentavos),
      grossPay: toPesos(grossCentavos),
      totalDeductions: toPesos(deductionCentavos),
      computedNetPay: toPesos(netCentavos),
      takeHomePercent: percentOf(netCentavos, grossCentavos),
      deductionPercent: percentOf(deductionCentavos, grossCentavos),
    },
    netPayCheck: {
      statedNetPay: hasStatedNet ? toPesos(statedNetCentavos) : null,
      computedNetPay: toPesos(netCentavos),
      difference: hasStatedNet ? toPesos(differenceCentavos) : null,
      matches: hasStatedNet ? Math.abs(differenceCentavos) <= NET_PAY_TOLERANCE_CENTAVOS : null,
    },
    flags,
    needsReview: flags.some((flag) => flag.severity === 'warning'),
    formulas: [
      'Gross pay = sum of all earnings',
      'Total deductions = sum of all deductions',
      'Net pay = Gross pay - Total deductions',
      'Share of gross = line amount / Gross pay x 100',
    ],
  };
}
