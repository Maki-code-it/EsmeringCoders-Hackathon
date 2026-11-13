import { AppError } from '../../middleware/apiResponse.js';
import { calculateBreakdown } from './calculator.js';
import { payrollRepository } from './repository.js';

// Business logic: calculate, save, and load payroll breakdowns. payroll_items are the source of truth; payroll_records hold calculated totals for fast dashboard reads.

const toDetails = (record) => ({
  id: record.id,
  employerName: record.employer_name,
  payPeriodStart: record.pay_period_start,
  payPeriodEnd: record.pay_period_end,
  paymentDate: record.payment_date,
  currency: record.currency,
  analysisStatus: record.analysis_status,
  createdAt: record.created_at,
});

export const createService = (repository = payrollRepository) => ({
  /** Calculate only. Nothing is saved. */
  preview(input) {
    return calculateBreakdown(input);
  },

  async listRecords(userId) {
    const rows = await repository.listRecords(userId);
    return rows.map((row) => ({
      id: row.id,
      employerName: row.employer_name,
      payPeriodStart: row.pay_period_start,
      payPeriodEnd: row.pay_period_end,
      grossPay: Number(row.gross_pay),
      totalDeductions: Number(row.total_deductions),
      netPay: Number(row.net_pay),
      analysisStatus: row.analysis_status,
      createdAt: row.created_at,
    }));
  },

  async createRecord(userId, input) {
    const breakdown = calculateBreakdown(input);
    const { totals, netPayCheck } = breakdown;

    // Link to the uploaded payslip, but only if it belongs to this user.
    if (input.documentId && !(await repository.documentBelongsToUser(userId, input.documentId))) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    const duplicate = await repository.findDuplicate(userId, {
      documentId: input.documentId,
      employerName: input.employerName,
      payPeriodStart: input.payPeriodStart,
      payPeriodEnd: input.payPeriodEnd,
    });
    if (duplicate) {
      throw new AppError(
        'You already saved a breakdown for this payslip. Open it from Saved breakdowns, or delete it first.',
        409,
        'DUPLICATE_PAYROLL_RECORD',
      );
    }

    const recordRow = {
      document_id: input.documentId || null,
      employer_name: input.employerName,
      pay_period_start: input.payPeriodStart,
      pay_period_end: input.payPeriodEnd,
      payment_date: input.paymentDate,
      basic_salary: totals.basicSalary,
      total_allowances: totals.totalAllowances,
      gross_pay: totals.grossPay,
      total_deductions: totals.totalDeductions,
      net_pay: netPayCheck.statedNetPay ?? totals.computedNetPay,
      currency: 'PHP',
      analysis_status: breakdown.needsReview ? 'needs_review' : 'completed',
      discrepancy_flags: breakdown.flags,
    };

    const itemRows = [
      ...breakdown.earnings.map((line) => ({ item_type: 'earning', category: line.category, description: line.description, amount: line.amount })),
      ...breakdown.deductions.map((line) => ({ item_type: 'deduction', category: line.category, description: line.description, amount: line.amount })),
    ];

    const id = await repository.createRecord(userId, recordRow, itemRows);
    return this.getRecord(userId, id);
  },

  /** Loads a saved record and recalculates its breakdown from the stored lines. */
  async getRecord(userId, recordId) {
    const found = await repository.getRecord(userId, recordId);
    if (!found) throw new AppError('Payroll record not found', 404, 'PAYROLL_RECORD_NOT_FOUND');

    const { record, items } = found;
    const toLine = (item) => ({ category: item.category, description: item.description, amount: Number(item.amount) });

    // net_pay holds the payslip's stated net pay, unless none was entered (then it holds the computed value and the saved flags say NET_PAY_NOT_ENTERED).
    const savedFlags = Array.isArray(record.discrepancy_flags) ? record.discrepancy_flags : [];
    const statedNetEntered = !savedFlags.some((flag) => flag?.code === 'NET_PAY_NOT_ENTERED');

    const breakdown = calculateBreakdown({
      earnings: items.filter((item) => item.item_type === 'earning').map(toLine),
      deductions: items.filter((item) => item.item_type === 'deduction').map(toLine),
      statedNetPay: statedNetEntered ? Number(record.net_pay) : null,
      payPeriodStart: record.pay_period_start,
      payPeriodEnd: record.pay_period_end,
    });

    return { record: toDetails(record), breakdown };
  },

  async deleteRecord(userId, recordId) {
    const deleted = await repository.deleteRecord(userId, recordId);
    if (!deleted) throw new AppError('Payroll record not found', 404, 'PAYROLL_RECORD_NOT_FOUND');
    return { id: recordId };
  },
});

export const payrollService = createService();
