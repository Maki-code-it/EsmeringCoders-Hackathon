import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { formatMoney, formatPct } from '../lib/format.js';

export default function DeductionBreakdown({ items, currency }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Deductions by type</CardTitle>
        <p className="text-sm text-muted-foreground">Totals across the selected pay periods.</p>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No deduction details yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.name}>
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span>
                    {formatMoney(item.total, currency)}{' '}
                    <span className="text-muted-foreground">({formatPct(item.sharePct)})</span>
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-secondary"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(item.sharePct)}
                  aria-label={`${item.name} share of deductions`}
                >
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, item.sharePct)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
