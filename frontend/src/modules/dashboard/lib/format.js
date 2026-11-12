/**
 * Pure formatting + chart helpers for the dashboard. No React, no aliases, so
 * they can be unit tested with plain Node.
 */

export const formatMoney = (value, currency = 'PHP') => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency }).format(Number(value));
};

export const formatPct = (value) =>
  value === null || value === undefined ? '—' : `${Number(value).toFixed(1)}%`;

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

const ANALYSIS_LABELS = {
  payslip: 'Payslip uploaded',
  contract: 'Contract uploaded',
  payroll: 'Payroll analysis',
  contract_review: 'Contract review',
};

/** Friendly label for a history item kind from the dashboard API. */
export const analysisLabel = (type) =>
  ANALYSIS_LABELS[type] ||
  String(type || 'Analysis')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());

/** "Up 4.8%" / "Down 2.0%" / "No change" / null for an unknown change. */
export const describeChange = (changePct) => {
  if (changePct === null || changePct === undefined) return null;
  if (changePct === 0) return 'No change';
  return `${changePct > 0 ? 'Up' : 'Down'} ${Math.abs(changePct).toFixed(1)}%`;
};

/**
 * Map trend points to SVG coordinates for a net-pay line chart.
 * Points without a net pay are skipped. Returns { points, path, min, max }.
 */
export const buildChartGeometry = (trend, { width = 640, height = 220, padding = 28 } = {}) => {
  const usable = trend.filter((p) => p.netPay !== null && p.netPay !== undefined);
  if (!usable.length) return { points: [], path: '', min: null, max: null };

  const values = usable.map((p) => p.netPay);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = usable.map((p, i) => ({
    ...p,
    x: padding + (usable.length === 1 ? innerW / 2 : (i / (usable.length - 1)) * innerW),
    y: padding + innerH - ((p.netPay - min) / span) * innerH,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return { points, path, min, max };
};

/** Trigger a browser download of text content. */
export const downloadTextFile = (filename, text, mime = 'text/csv;charset=utf-8') => {
  const blob = new Blob(['\ufeff', text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
