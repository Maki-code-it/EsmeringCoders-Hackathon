/**
 * Pure analytics helpers for the dashboard. No I/O, no Express, no Supabase,
 * so they are deterministic and easy to test. All figures are CALCULATED from
 * the user's stored payroll records (never AI-generated).
 */

export const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Coerce a DB numeric (number | numeric string | null) to a number or null. */
export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const sum = (values) => values.reduce((acc, v) => acc + v, 0);

const average = (values) => (values.length ? round2(sum(values) / values.length) : null);

/** Best available date (YYYY-MM-DD) that places a record on the timeline. */
export const recordDate = (record) => {
  const raw = record.pay_period_end || record.pay_period_start || record.created_at;
  return raw ? String(raw).slice(0, 10) : null;
};

/** Keep records whose date is within [from, to] (inclusive, either optional). */
export const filterByRange = (records, { from, to } = {}) =>
  records.filter((record) => {
    const date = recordDate(record);
    if (!date) return !from && !to;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  });

/**
 * Records still 'pending' hold the column defaults (0), not real figures, so
 * they must not drag averages down or appear in trends.
 */
export const isAnalyzed = (record) => record.analysis_status !== 'pending';

/** Normalise a payroll_records row into numbers + a timeline date. */
export const normalizeRecord = (record) => ({
  id: record.id,
  documentId: record.document_id ?? null,
  employerName: record.employer_name ?? null,
  periodStart: record.pay_period_start ?? null,
  periodEnd: record.pay_period_end ?? null,
  date: recordDate(record),
  analysisStatus: record.analysis_status ?? null,
  basicSalary: toNumber(record.basic_salary),
  totalAllowances: toNumber(record.total_allowances),
  grossPay: toNumber(record.gross_pay),
  totalDeductions: toNumber(record.total_deductions),
  netPay: toNumber(record.net_pay),
  currency: record.currency || 'PHP',
});

/**
 * Salary trend points, oldest first, with change versus the previous point that
 * has a net pay.
 */
export const buildSalaryTrend = (records) => {
  const points = records
    .map(normalizeRecord)
    .filter((r) => r.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  let previousNet = null;
  return points.map((point) => {
    let changeNet = null;
    let changePct = null;
    if (point.netPay !== null && previousNet !== null) {
      changeNet = round2(point.netPay - previousNet);
      changePct = previousNet !== 0 ? round2((changeNet / previousNet) * 100) : null;
    }
    if (point.netPay !== null) previousNet = point.netPay;
    return { ...point, changeNet, changePct };
  });
};

/** Share of gross pay taken by deductions, as a percentage. Null if unknowable. */
export const deductionRate = ({ grossPay, totalDeductions }) =>
  grossPay && totalDeductions !== null ? round2((totalDeductions / grossPay) * 100) : null;

/**
 * Group deduction lines by name (case-insensitive) with totals and share.
 * Input rows are payroll_items of type 'deduction': { description, category, amount }.
 */
export const buildDeductionBreakdown = (deductions) => {
  const groups = new Map();
  for (const row of deductions) {
    const amount = toNumber(row.amount);
    const name = String(row.description || row.category || '').trim();
    if (amount === null || !name) continue;
    const key = name.toLowerCase();
    const group = groups.get(key) || { name, total: 0, count: 0 };
    group.total += amount;
    group.count += 1;
    groups.set(key, group);
  }
  const grand = sum([...groups.values()].map((g) => g.total));
  return [...groups.values()]
    .map((g) => ({
      name: g.name,
      total: round2(g.total),
      count: g.count,
      sharePct: grand > 0 ? round2((g.total / grand) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
};

/** Aggregate statistics over a set of payroll records. */
export const summarizeRecords = (records) => {
  const trend = buildSalaryTrend(records);
  const pick = (key) => trend.map((p) => p[key]).filter((v) => v !== null);
  const nets = pick('netPay');
  const grosses = pick('grossPay');
  const deductions = pick('totalDeductions');
  const latest = trend.length ? trend[trend.length - 1] : null;
  const highestNet = nets.length ? Math.max(...nets) : null;
  const lowestNet = nets.length ? Math.min(...nets) : null;

  return {
    recordCount: trend.length,
    currency: latest?.currency || 'PHP',
    latest,
    averageNetPay: average(nets),
    averageGrossPay: average(grosses),
    averageDeductions: average(deductions),
    totalNetPay: nets.length ? round2(sum(nets)) : null,
    totalDeductions: deductions.length ? round2(sum(deductions)) : null,
    highestNetPay: highestNet,
    lowestNetPay: lowestNet,
    averageDeductionRatePct: average(
      trend.map(deductionRate).filter((v) => v !== null),
    ),
  };
};

/** Count items by a key function; returns a plain object. */
export const countBy = (items, keyFn) =>
  items.reduce((acc, item) => {
    const key = keyFn(item) || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
