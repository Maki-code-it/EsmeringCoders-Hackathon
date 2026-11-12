import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { buildChartGeometry, describeChange, formatDate, formatMoney } from '../lib/format.js';

const W = 640;
const H = 220;

/**
 * Net pay over time as a dependency-free SVG line chart. A data table below it
 * gives the same numbers to screen readers and keyboard users.
 */
export default function SalaryTrendChart({ points }) {
  const geometry = buildChartGeometry(points, { width: W, height: H });
  const currency = points[0]?.currency || 'PHP';

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Salary trend</CardTitle>
        <p className="text-sm text-muted-foreground">Net pay for each pay period (calculated).</p>
      </CardHeader>
      <CardContent>
        {geometry.points.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No net pay values yet. Review a payslip to see your trend.
          </p>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              role="img"
              aria-labelledby="trend-title"
              className="h-auto w-full text-primary"
            >
              <title id="trend-title">
                {`Net pay from ${formatMoney(geometry.min, currency)} to ${formatMoney(geometry.max, currency)} across ${geometry.points.length} pay periods`}
              </title>
              <path d={geometry.path} fill="none" stroke="currentColor" strokeWidth="2.5" />
              {geometry.points.map((p) => (
                <circle key={p.id} cx={p.x} cy={p.y} r="4" fill="currentColor" />
              ))}
            </svg>

            <table className="mt-4 w-full text-left text-sm">
              <caption className="sr-only">Net pay by pay period</caption>
              <thead className="text-muted-foreground">
                <tr>
                  <th scope="col" className="py-1 pr-2 font-medium">Period end</th>
                  <th scope="col" className="py-1 pr-2 font-medium">Net pay</th>
                  <th scope="col" className="py-1 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-1.5 pr-2">{formatDate(p.date)}</td>
                    <td className="py-1.5 pr-2">{formatMoney(p.netPay, p.currency)}</td>
                    <td className="py-1.5 text-muted-foreground">{describeChange(p.changePct) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
