import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {
  buildDeductionBreakdown,
  buildSalaryTrend,
  deductionRate,
  filterByRange,
  summarizeRecords,
} from '../analytics.js';
import { escapeCsvCell, toCsv } from '../reportBuilder.js';
import { createService } from '../service.js';
import { requireAuthenticatedUser } from '../userContext.js';
import { validateHistoryQuery, validateRangeQuery } from '../validators.js';
import { createRepository } from '../repository.js';
import { errorHandler } from '../../../middleware/errorHandler.js';

const records = [
  { id: 'b', created_at: '2026-02-20T00:00:00Z', pay_period_start: '2026-02-01', pay_period_end: '2026-02-15', basic_salary: '20000', gross_pay: '22000', total_deductions: '2200', net_pay: '19800', currency: 'PHP' },
  { id: 'a', created_at: '2026-01-20T00:00:00Z', pay_period_start: '2026-01-01', pay_period_end: '2026-01-15', basic_salary: 20000, gross_pay: 21000, total_deductions: 2100, net_pay: 18900, currency: 'PHP' },
  { id: 'c', pay_period_end: null, pay_period_start: null, created_at: '2026-03-20T00:00:00Z', net_pay: null, gross_pay: null, total_deductions: null },
];

test('salary trend is sorted oldest first with change vs previous', () => {
  const trend = buildSalaryTrend(records);
  assert.deepEqual(trend.map((p) => p.id), ['a', 'b', 'c']);
  assert.equal(trend[0].changeNet, null);
  assert.equal(trend[1].changeNet, 900);
  assert.equal(trend[1].changePct, 4.76);
  assert.equal(trend[2].changeNet, null); // missing net pay is not treated as zero
});

test('summary averages ignore missing values', () => {
  const s = summarizeRecords(records);
  assert.equal(s.recordCount, 3);
  assert.equal(s.averageNetPay, 19350);
  assert.equal(s.highestNetPay, 19800);
  assert.equal(s.lowestNetPay, 18900);
  assert.equal(s.latest.id, 'c');
});

test('empty input gives nulls, not NaN', () => {
  const s = summarizeRecords([]);
  assert.equal(s.recordCount, 0);
  assert.equal(s.averageNetPay, null);
  assert.equal(s.latest, null);
});

test('deduction rate and breakdown', () => {
  assert.equal(deductionRate({ grossPay: 1000, totalDeductions: 100 }), 10);
  assert.equal(deductionRate({ grossPay: 0, totalDeductions: 100 }), null);
  const b = buildDeductionBreakdown([
    { description: 'SSS', category: 'government', amount: '500' },
    { description: ' sss ', amount: 500 },
    { description: 'PhilHealth', amount: 250 },
    { description: '', category: '', amount: 10 },
    { description: 'Bad', amount: null },
    { description: '', category: 'Loan', amount: 5 },
  ]);
  assert.equal(b.length, 3); // SSS, PhilHealth, Loan (category used when description is empty)
  assert.equal(b[0].name, 'SSS');
  assert.equal(b[0].total, 1000);
  assert.equal(b[0].sharePct, 79.68);
});

test('range filter is inclusive', () => {
  const out = filterByRange(records, { from: '2026-02-15', to: '2026-02-15' });
  assert.deepEqual(out.map((r) => r.id), ['b']);
});

test('csv escaping blocks formula injection and quotes', () => {
  assert.equal(escapeCsvCell('=1+1'), "'=1+1");
  assert.equal(escapeCsvCell('a,b'), '"a,b"');
  assert.equal(escapeCsvCell('say "hi"'), '"say ""hi"""');
  assert.equal(escapeCsvCell(-5), '-5');
  assert.equal(escapeCsvCell(null), '');
  assert.equal(toCsv(['x', 'y'], [[1, 'z']]), 'x,y\r\n1,z');
});

test('query validators', () => {
  assert.deepEqual(validateRangeQuery({ query: { from: '2026-01-01', to: '2026-02-01' } }), {});
  assert.ok(validateRangeQuery({ query: { from: '2026-13-01' } }).from);
  assert.ok(validateRangeQuery({ query: { from: '2026-03-01', to: '2026-02-01' } }).from);
  assert.deepEqual(validateHistoryQuery({ query: { limit: '10', offset: '0', type: 'ocr' } }), {});
  assert.ok(validateHistoryQuery({ query: { limit: '1000' } }).limit);
  assert.ok(validateHistoryQuery({ query: { type: "x'; drop" } }).type);
});

const fakeRepo = {
  listPayrollRecords: async () => [...records, { id: 'p', analysis_status: 'pending', net_pay: 0, gross_pay: 0, total_deductions: 0, created_at: '2026-04-01T00:00:00Z' }],
  listDocuments: async () => [
    { id: 'd1', document_type: 'payslip', file_name: 'jan.pdf', status: 'completed', created_at: '2026-01-02T00:00:00Z' },
  ],
  listDeductions: async () => [{ payroll_record_id: 'a', category: 'government', description: 'SSS', amount: 100 }],
};

test('service builds summary, history and report', async () => {
  const svc = createService(fakeRepo);
  const summary = await svc.getSummary('u1');
  assert.equal(summary.documents.byType.payslip, 1);
  assert.equal(summary.analysesCount, 3); // analyzed payroll records

  const history = await svc.getHistory('u1', { limit: 2, offset: 0 });
  assert.equal(history.total, 5); // 1 document + 4 payroll
  assert.equal(history.items.length, 2);
  assert.equal(history.items[0].kind, 'payroll'); // newest first
  const noReviews = await svc.getHistory('u1', { limit: 10, offset: 0, type: 'contract_review' });
  assert.equal(noReviews.total, 0); // reviews no longer appear in history

  const report = await svc.getPayrollReport('u1', {}, new Date('2026-04-01T00:00:00Z'));
  assert.equal(report.filename, 'earnest-payroll-report-2026-04-01.csv');
  assert.match(report.csv, /^Pay period start,/);
  assert.equal(report.source, 'calculated');
});

test('repository scopes every query by user_id and hides DB errors', async () => {
  const calls = [];
  const chain = (table) => {
    const q = {
      select: () => q,
      eq: (col, val) => (calls.push([table, col, val]), q),
      in: () => q,
      order: () => q,
      limit: () => Promise.resolve({ data: [], error: null }),
    };
    return q;
  };
  const repo = createRepository(() => ({ from: chain }));
  await repo.listPayrollRecords('u1');
  await repo.listDocuments('u1');
  assert.ok(calls.every(([, col, val]) => col === 'user_id' && val === 'u1'));

  const broken = createRepository(() => ({
    from: () => {
      const q = { select: () => q, eq: () => q, order: () => q, limit: () => Promise.resolve({ data: null, error: { message: 'secret internals' } }) };
      return q;
    },
  }));
  await assert.rejects(() => broken.listPayrollRecords('u1'), (e) => e.code === 'DASHBOARD_DATA_ERROR' && !/secret/.test(e.message));
});

test('user guard: scopes to req.user, ignores query ids, refuses anonymous in production', () => {
  const run = (req) => {
    let err;
    requireAuthenticatedUser(req, {}, (e) => { err = e; });
    return { req, err };
  };
  const ok = run({ user: { id: 'u9' }, query: { userId: 'evil' } });
  assert.equal(ok.err, undefined);
  assert.equal(ok.req.dashboardUserId, 'u9');

  const prev = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    assert.equal(run({ query: {} }).err.statusCode, 401);
    process.env.NODE_ENV = 'development';
    const dev = run({ query: { userId: 'evil' } });
    assert.equal(dev.err, undefined);
    const prevDev = process.env.DEV_USER_ID;
    delete process.env.DEV_USER_ID;
    assert.equal(run({ query: {} }).req.dashboardUserId, null);
    process.env.DEV_USER_ID = 'dev-user';
    assert.equal(run({ query: { userId: 'evil' } }).req.dashboardUserId, 'dev-user');
    if (prevDev === undefined) delete process.env.DEV_USER_ID;
    else process.env.DEV_USER_ID = prevDev;
  } finally {
    process.env.NODE_ENV = prev;
  }
});

test('repository leaves queries unscoped only when there is no user id', async () => {
  const calls = [];
  const chain = () => {
    const q = {
      select: () => q,
      eq: (col, val) => (calls.push([col, val]), q),
      in: () => q,
      order: () => q,
      limit: () => Promise.resolve({ data: [], error: null }),
    };
    return q;
  };
  const repo = createRepository(() => ({ from: chain }));
  await repo.listDocuments(null);
  assert.equal(calls.length, 0);
  await repo.listDocuments('u1');
  assert.deepEqual(calls, [['user_id', 'u1']]);
});
test('router rejects unauthenticated requests in production with the shared error format', async () => {
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const { default: router } = await import('../routes.js');
  const app = express();
  app.use('/api/dashboard', router);
  app.use(errorHandler);
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/api/dashboard/summary`);
    const body = await res.json();
    assert.equal(res.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'UNAUTHENTICATED');
  } finally {
    process.env.NODE_ENV = prevEnv;
    server.close();
  }
});
