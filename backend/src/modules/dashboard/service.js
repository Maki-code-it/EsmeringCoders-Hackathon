import {
  buildDeductionBreakdown,
  buildSalaryTrend,
  countBy,
  deductionRate,
  filterByRange,
  isAnalyzed,
  summarizeRecords,
} from './analytics.js';
import { REPORT_DISCLAIMER, buildPayrollCsv, buildReportFilename } from './reportBuilder.js';
import { dashboardRepository } from './repository.js';

const LABELS = { source: 'calculated' };

// Dashboard business logic. Reads data other modules own and derives statistics from it; it never duplicates their calculations or writes data.
export const createService = (repo = dashboardRepository) => {
  // Pending records only hold column defaults (0), so they are left out of stats.
  const loadRecords = async (userId, range) =>
    filterByRange((await repo.listPayrollRecords(userId)).filter(isAnalyzed), range);

  return {
    async getSummary(userId) {
      const [allRecords, documents] = await Promise.all([
        repo.listPayrollRecords(userId),
        repo.listDocuments(userId),
      ]);
      const analyzed = allRecords.filter(isAnalyzed);
      return {
        ...LABELS,
        payroll: summarizeRecords(analyzed),
        documents: {
          total: documents.length,
          byType: countBy(documents, (d) => d.document_type),
          byStatus: countBy(documents, (d) => d.status),
        },
        analysesCount: analyzed.length,
      };
    },

    // History is assembled from existing tables (there is no history table): uploaded documents and payroll breakdowns, newest first. kind: 'payslip' | 'contract' | 'payroll'
    async getHistory(userId, { limit, offset, type }) {
      const [documents, records] = await Promise.all([
        repo.listDocuments(userId),
        repo.listPayrollRecords(userId),
      ]);
      const nameById = new Map(documents.map((d) => [d.id, d.file_name]));

      const all = [
        ...documents.map((d) => ({
          id: d.id,
          kind: d.document_type,
          status: d.status,
          filename: d.file_name,
          createdAt: d.created_at,
        })),
        ...records.map((r) => ({
          id: r.id,
          kind: 'payroll',
          status: r.analysis_status,
          filename: nameById.get(r.document_id) ?? null,
          createdAt: r.created_at,
        })),
      ]
        .filter((item) => !type || item.kind === type)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));

      return { total: all.length, limit, offset, items: all.slice(offset, offset + limit) };
    },

    async getSalaryTrends(userId, range) {
      const trend = buildSalaryTrend(await loadRecords(userId, range));
      return { ...LABELS, points: trend, count: trend.length };
    },

    async getAnalytics(userId, range) {
      const records = await loadRecords(userId, range);
      const deductions = await repo.listDeductions(
        userId,
        records.map((r) => r.id),
      );
      const trend = buildSalaryTrend(records);
      return {
        ...LABELS,
        summary: summarizeRecords(records),
        deductionBreakdown: buildDeductionBreakdown(deductions),
        deductionRateByPeriod: trend.map((p) => ({
          recordId: p.id,
          date: p.date,
          ratePct: deductionRate(p),
        })),
      };
    },

    async getPayrollReport(userId, range, now = new Date()) {
      const records = await loadRecords(userId, range);
      const trend = buildSalaryTrend(records);
      const deductions = await repo.listDeductions(
        userId,
        records.map((r) => r.id),
      );
      return {
        ...LABELS,
        generatedAt: now.toISOString(),
        range: { from: range?.from ?? null, to: range?.to ?? null },
        filename: buildReportFilename(now),
        disclaimer: REPORT_DISCLAIMER,
        summary: summarizeRecords(records),
        deductionBreakdown: buildDeductionBreakdown(deductions),
        points: trend,
        csv: buildPayrollCsv(trend, deductionRate),
      };
    },
  };
};

export const dashboardService = createService();
