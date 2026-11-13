import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { describeChange, formatDate, formatMoney } from '../lib/format.js';

const MAX_BARS = 6;

const shortDate = (value) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(d);
};

/** One plain sentence about the latest pay compared with the one before it. */
const headline = (points) => {
  const latest = points[points.length - 1];
  const change = describeChange(latest.changePct);
  if (points.length === 1 || !change) return 'This is your first saved pay. Save more payslips to see how it changes.';
  if (change === 'No change') return 'Your take-home pay is the same as last time.';
  return `Your take-home pay is ${change.toLowerCase()} compared with last time.`;
};

// Take-home pay for your latest pay periods as simple bars, with one sentence on top. The full list is one click away for anyone who wants every number.
export default function SalaryTrendChart({ points }) {
  const withPay = points.filter((p) => p.netPay !== null && p.netPay !== undefined);
  const shown = withPay.slice(-MAX_BARS);
  const max = Math.max(...shown.map((p) => p.netPay), 1);
  const currency = withPay[0]?.currency || 'PHP';

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Your take-home pay</CardTitle>
        <p className="text-sm text-muted-foreground">
          {withPay.length ? headline(withPay) : 'What you receive after deductions, for each pay period.'}
        </p>
      </CardHeader>
      <CardContent>
        {withPay.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing to show yet. Save a payroll breakdown to see your pay here.
          </p>
        ) : (
          <>
            <ul className="flex h-48 items-end gap-3" aria-label="Take-home pay for each pay period">
              {shown.map((p) => (
                <li key={p.id} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
                  <span className="mb-1 truncate text-xs font-medium">{formatMoney(p.netPay, currency)}</span>
                  <span
                    className="w-full rounded-t-xl bg-primary/80"
                    style={{ height: `${Math.max(4, (p.netPay / max) * 75)}%` }}
                    aria-hidden="true"
                  />
                  <span className="mt-1.5 text-xs text-muted-foreground">{shortDate(p.date)}</span>
                </li>
              ))}
            </ul>

            {withPay.length > shown.length && (
              <p className="mt-3 text-xs text-muted-foreground">Showing your latest {shown.length} pay periods.</p>
            )}

            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-medium text-primary">See every pay period</summary>
              <table className="mt-3 w-full text-left">
                <caption className="sr-only">Take-home pay by pay period</caption>
                <thead className="text-muted-foreground">
                  <tr>
                    <th scope="col" className="py-1 pr-2 font-medium">Pay period ended</th>
                    <th scope="col" className="py-1 pr-2 font-medium">Take-home pay</th>
                    <th scope="col" className="py-1 font-medium">Compared with last time</th>
                  </tr>
                </thead>
                <tbody>
                  {[...withPay].reverse().map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-1.5 pr-2">{formatDate(p.date)}</td>
                      <td className="py-1.5 pr-2">{formatMoney(p.netPay, p.currency)}</td>
                      <td className="py-1.5 text-muted-foreground">{describeChange(p.changePct) ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}
