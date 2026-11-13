import { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { formatDate, formatMoney } from '../lib/format.js';

function Lines({ title, lines }) {
  if (!lines?.length) return null;
  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold">{title}</h3>
      <ul className="divide-y text-sm">
        {lines.map((line, index) => (
          <li key={`${line.category}-${index}`} className="flex justify-between gap-3 py-1.5">
            <span>{line.description || line.categoryLabel}</span>
            <span className="tabular-nums">{formatMoney(line.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Read-only view of one saved payroll breakdown (native <dialog>, pinned to the screen). */
export default function PayrollViewDialog({ data, onClose }) {
  const ref = useRef(null);
  const titleId = useId();
  const open = Boolean(data);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Keep the page behind the modal from scrolling while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const previous = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';
    return () => {
      window.document.body.style.overflow = previous;
    };
  }, [open]);

  const record = data?.record;
  const breakdown = data?.breakdown;
  const totals = breakdown?.totals;
  const warning = breakdown?.flags?.find((flag) => flag.severity === 'warning');

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="glass fixed inset-0 m-auto h-fit max-h-[88vh] w-[min(94vw,36rem)] overflow-hidden rounded-3xl p-0 text-foreground backdrop:bg-foreground/30 backdrop:backdrop-blur-sm"
    >
      {data && (
        <div className="max-h-[88vh] space-y-4 overflow-y-auto p-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {record.employerName || 'Payslip'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {record.payPeriodStart && record.payPeriodEnd
                ? `${formatDate(record.payPeriodStart)} to ${formatDate(record.payPeriodEnd)}`
                : 'Pay period not set'}
            </p>
          </div>

          <Lines title="What you earned" lines={breakdown.earnings} />
          <Lines title="What was taken out" lines={breakdown.deductions} />

          <dl className="space-y-1 rounded-2xl bg-muted p-4 text-sm">
            <div className="flex justify-between">
              <dt>Total earned</dt>
              <dd className="tabular-nums">{formatMoney(totals.grossPay)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Total taken out</dt>
              <dd className="tabular-nums">{formatMoney(totals.totalDeductions)}</dd>
            </div>
            <div className="flex justify-between border-t pt-1 font-semibold">
              <dt>Take-home pay</dt>
              <dd className="tabular-nums">{formatMoney(breakdown.netPayCheck.statedNetPay ?? totals.computedNetPay)}</dd>
            </div>
          </dl>

          {warning && (
            <p className="flex gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{warning.message}</span>
            </p>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
