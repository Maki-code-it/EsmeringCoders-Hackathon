import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { cn } from '@/components/utils.js';
import { formatMoney, formatPeriod } from '../lib/payslipForm.js';

/** Saved breakdowns for the current user, newest first. */
export default function RecordList({ records, status, selectedId, onSelect, onNew }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Saved breakdowns</CardTitle>
        <Button variant="outline" size="sm" onClick={onNew}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New
        </Button>
      </CardHeader>
      <CardContent>
        {status === 'loading' && <p className="text-sm text-muted-foreground">Loading...</p>}
        {status === 'error' && <p className="text-sm text-destructive">Could not load saved breakdowns.</p>}
        {status === 'ready' && records.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing saved yet. Calculate a breakdown and save it.</p>
        )}
        {records.length > 0 && (
          <ul className="space-y-1">
            {records.map((record) => (
              <li key={record.id}>
                <button
                  type="button"
                  onClick={() => onSelect(record.id)}
                  aria-current={record.id === selectedId ? 'true' : undefined}
                  className={cn(
                    'w-full rounded-2xl px-3.5 py-2.5 text-left text-sm transition-colors',
                    record.id === selectedId ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{record.employerName || 'Payslip'}</span>
                    <span className="shrink-0 tabular-nums">{formatMoney(record.netPay)}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2 text-xs opacity-80">
                    <span>{formatPeriod(record.payPeriodStart, record.payPeriodEnd)}</span>
                    {record.analysisStatus === 'needs_review' && <span>Needs review</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
