import { Banknote, FileText, Percent, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { describeChange, formatMoney, formatPct } from '../lib/format.js';

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function StatCards({ summary }) {
  const { payroll, documents } = summary;
  const currency = payroll.currency;
  const change = describeChange(payroll.latest?.changePct);

  return (
    <section aria-label="Key figures" className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        icon={Banknote}
        label="Latest net pay"
        value={formatMoney(payroll.latest?.netPay, currency)}
        hint={change ? `${change} vs previous period` : 'Calculated from your records'}
      />
      <Stat
        icon={Receipt}
        label="Average net pay"
        value={formatMoney(payroll.averageNetPay, currency)}
        hint={`${payroll.recordCount} payroll record${payroll.recordCount === 1 ? '' : 's'}`}
      />
      <Stat
        icon={Percent}
        label="Average deduction rate"
        value={formatPct(payroll.averageDeductionRatePct)}
        hint="Share of gross pay"
      />
      <Stat
        icon={FileText}
        label="Documents"
        value={documents.total}
        hint={`${summary.analysesCount} past analys${summary.analysesCount === 1 ? 'is' : 'es'}`}
      />
    </section>
  );
}
