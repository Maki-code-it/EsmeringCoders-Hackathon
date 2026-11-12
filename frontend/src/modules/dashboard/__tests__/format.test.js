import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analysisLabel,
  buildChartGeometry,
  describeChange,
  formatDate,
  formatMoney,
  formatPct,
} from '../lib/format.js';

test('formatters handle missing values', () => {
  assert.equal(formatMoney(null), '—');
  assert.equal(formatPct(undefined), '—');
  assert.equal(formatDate('not a date'), '—');
  assert.match(formatMoney(1234.5), /1,234\.50/);
  assert.equal(formatPct(12.345), '12.3%');
});

test('analysisLabel maps known and unknown types', () => {
  assert.equal(analysisLabel('some_new_type'), 'Some new type');
});

test('describeChange', () => {
  assert.equal(describeChange(null), null);
  assert.equal(describeChange(0), 'No change');
  assert.equal(describeChange(4.76), 'Up 4.8%');
  assert.equal(describeChange(-2), 'Down 2.0%');
});

test('chart geometry stays inside the box and skips missing net pay', () => {
  const g = buildChartGeometry(
    [{ id: 1, netPay: 100 }, { id: 2, netPay: null }, { id: 3, netPay: 200 }],
    { width: 100, height: 100, padding: 10 },
  );
  assert.equal(g.points.length, 2);
  assert.equal(g.points[0].y, 90); // lowest value at the bottom
  assert.equal(g.points[1].y, 10); // highest at the top
  assert.ok(g.path.startsWith('M'));
});

test('chart geometry handles empty and single point input', () => {
  assert.equal(buildChartGeometry([]).path, '');
  const one = buildChartGeometry([{ id: 1, netPay: 50 }]);
  assert.equal(one.points.length, 1);
  assert.ok(Number.isFinite(one.points[0].y));
});
