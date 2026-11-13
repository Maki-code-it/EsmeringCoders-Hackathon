import { AlertTriangle, CheckCircle2, Info, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { cn } from '@/components/utils.js';
import { formatMoney, formatPercent } from '../lib/payslipForm.js';
import { explainBreakdown } from '../lib/breakdownExplanations.js';

/** Small label that says where a number came from. */
function SourceTag({ kind }) {
  const styles = {
    payslip: 'bg-secondary text-secondary-foreground',
    calculated: 'bg-primary/10 text-primary',
  };
  const labels = { payslip: 'From your payslip', calculated: 'Calculated by Earnest' };
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', styles[kind])}>{labels[kind]}</span>
  );
}

function StatCard({ label, value, sub, emphasis }) {
  return (
    <Card className={cn(emphasis && 'border-primary/40 bg-primary/5')}>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function LinesTable({ title, lines, total, barClass }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <SourceTag kind="payslip" />
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">None entered.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="pb-2 font-medium">Item</th>
                <th className="pb-2 text-right font-medium">Amount</th>
                <th className="w-28 pb-2 text-right font-medium">Share of gross</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={`${line.category}-${index}`} className="border-b last:border-0">
                  <td className="py-2">
                    <p className="font-medium">{line.description}</p>
                    {line.description !== line.categoryLabel && (
                      <p className="text-xs text-muted-foreground">{line.categoryLabel}</p>
                    )}
                  </td>
                  <td className="py-2 text-right tabular-nums">{formatMoney(line.amount)}</td>
                  <td className="py-2 pl-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                        <div className={cn('h-full', barClass)} style={{ width: `${Math.min(line.percentOfGross ?? 0, 100)}%` }} />
                      </div>
                      <span className="w-12 text-right text-xs tabular-nums">{formatPercent(line.percentOfGross)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="pt-3">Total</td>
                <td className="pt-3 text-right tabular-nums">{formatMoney(total)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function NetPayCheck({ check }) {
  let state;
  if (check.statedNetPay === null) {
    state = { icon: MinusCircle, text: 'Not checked. Enter the net pay on your payslip to compare.', style: 'text-muted-foreground' };
  } else if (check.matches) {
    state = { icon: CheckCircle2, text: 'Your payslip net pay matches the computed net pay.', style: 'text-emerald-700' };
  } else {
    state = { icon: AlertTriangle, text: `Difference of ${formatMoney(Math.abs(check.difference))}. Worth asking payroll about.`, style: 'text-amber-700' };
  }
  const Icon = state.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net pay check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">Net pay on payslip <SourceTag kind="payslip" /></span>
          <span className="font-medium tabular-nums">{formatMoney(check.statedNetPay)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">Computed net pay <SourceTag kind="calculated" /></span>
          <span className="font-medium tabular-nums">{formatMoney(check.computedNetPay)}</span>
        </div>
        <p role="status" className={cn('flex items-start gap-2 border-t pt-3 font-medium', state.style)}>
          <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {state.text}
        </p>
      </CardContent>
    </Card>
  );
}

function Flags({ flags }) {
  if (!flags.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Things to review</CardTitle>
        <p className="text-xs text-muted-foreground">These are prompts to ask HR, not findings that anything is wrong.</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {flags.map((flag) => {
            const warning = flag.severity === 'warning';
            const Icon = warning ? AlertTriangle : Info;
            return (
              <li
                key={`${flag.code}-${flag.message}`}
                className={cn(
                  'flex gap-2 rounded-2xl p-3.5 text-sm',
                  warning ? 'bg-amber-50 text-amber-900' : 'bg-secondary text-secondary-foreground',
                )}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {flag.message}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Shows the actual numbers plugged into each formula, so the math is checkable. */
function HowCalculated({ breakdown }) {
  const { earnings, deductions, totals } = breakdown;
  const join = (lines) => (lines.length ? lines.map((line) => formatMoney(line.amount)).join(' + ') : formatMoney(0));

  const rows = [
    { label: 'Gross pay', formula: `${join(earnings)}`, result: totals.grossPay },
    { label: 'Total deductions', formula: `${join(deductions)}`, result: totals.totalDeductions },
    { label: 'Net pay', formula: `${formatMoney(totals.grossPay)} - ${formatMoney(totals.totalDeductions)}`, result: totals.computedNetPay },
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>How we calculated this</CardTitle>
        <SourceTag kind="calculated" />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl bg-muted p-3.5">
            <p className="font-medium">{row.label}</p>
            <p className="break-words text-xs text-muted-foreground tabular-nums">
              {row.formula} = <span className="font-semibold text-foreground">{formatMoney(row.result)}</span>
            </p>
          </div>
        ))}
        <p className="pt-1 text-xs text-muted-foreground">
          Share of gross = line amount / gross pay x 100. Earnest adds up what you entered. It does not check
          whether contribution or tax rates are correct.
        </p>
      </CardContent>
    </Card>
  );
}

function ExplanationGroup({ title, items }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <dl className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="rounded-2xl bg-muted p-3.5">
            <dt className="flex flex-wrap items-baseline justify-between gap-x-3 font-medium">
              <span>{item.label}</span>
              <span className="tabular-nums">
                {item.amount}
                {item.share && <span className="text-xs font-normal text-muted-foreground">{item.share}</span>}
              </span>
            </dt>
            <dd className="mt-0.5 text-xs text-muted-foreground">{item.meaning}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Plain-language summary of the whole payslip, then what each line means.
function BreakdownExplanation({ breakdown }) {
  const explained = explainBreakdown(breakdown);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>What your breakdown means</CardTitle>
        <SourceTag kind="calculated" />
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5">{explained.summary}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <ExplanationGroup title="Earnings (added to your pay)" items={explained.earnings} />
          <ExplanationGroup title="Deductions (taken from your pay)" items={explained.deductions} />
        </div>
        <ExplanationGroup title="Totals" items={explained.totals} />
        <p className="text-xs text-muted-foreground">
          These are general descriptions of each item. Current contribution and tax rates change, so check them with
          SSS, PhilHealth, Pag-IBIG or the BIR.
        </p>
      </CardContent>
    </Card>
  );
}

/** Full breakdown for one payslip, from the backend calculator's result. */
export default function BreakdownView({ breakdown }) {
  const { totals } = breakdown;

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gross pay" value={formatMoney(totals.grossPay)} sub={`Basic ${formatMoney(totals.basicSalary)} + others ${formatMoney(totals.totalAllowances)}`} />
        <StatCard label="Total deductions" value={formatMoney(totals.totalDeductions)} sub={`${formatPercent(totals.deductionPercent)} of gross pay`} />
        <StatCard label="Net pay (take-home)" value={formatMoney(totals.computedNetPay)} sub={`You keep ${formatPercent(totals.takeHomePercent)} of gross pay`} emphasis />
      </div>

      <BreakdownExplanation breakdown={breakdown} />

      <div className="grid gap-4 lg:grid-cols-2">
        <LinesTable title="Earnings" lines={breakdown.earnings} total={totals.grossPay} barClass="bg-primary" />
        <LinesTable title="Deductions" lines={breakdown.deductions} total={totals.totalDeductions} barClass="bg-amber-500" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <NetPayCheck check={breakdown.netPayCheck} />
        <HowCalculated breakdown={breakdown} />
      </div>

      <Flags flags={breakdown.flags} />

      <p className="text-xs text-muted-foreground">
        General information only, not legal or payroll advice. Figures depend on what you entered. Confirm anything
        unclear with your HR or payroll office, or with DOLE.
      </p>
    </div>
  );
}
