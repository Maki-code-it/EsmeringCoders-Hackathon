import { Calculator, FlaskConical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Input, Label } from '@/components/ui/input.jsx';
import LineItemsEditor from './LineItemsEditor.jsx';
import { DEDUCTION_OPTIONS, EARNING_OPTIONS, emptyForm, sampleForm } from '../lib/payslipForm.js';

/** Payslip entry form. The user types or confirms the figures from their payslip. */
export default function PayslipForm({ form, onChange, onCalculate, busy, errors }) {
  const set = (field) => (event) => onChange({ ...form, [field]: event.target.value });

  const submit = (event) => {
    event.preventDefault();
    onCalculate();
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Payslip details</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Copy the figures exactly as they appear on your payslip. Leave an amount blank if the line is not on it.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onChange(sampleForm())}>
            <FlaskConical className="h-4 w-4" aria-hidden="true" />
            Use sample payslip
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(emptyForm())}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Clear
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} className="space-y-6" noValidate>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <Label htmlFor="employerName">Employer (optional)</Label>
              <Input id="employerName" maxLength={120} value={form.employerName} onChange={set('employerName')} />
            </div>
            <div>
              <Label htmlFor="payPeriodStart">Pay period start</Label>
              <Input id="payPeriodStart" type="date" value={form.payPeriodStart} onChange={set('payPeriodStart')} />
            </div>
            <div>
              <Label htmlFor="payPeriodEnd">Pay period end</Label>
              <Input id="payPeriodEnd" type="date" value={form.payPeriodEnd} onChange={set('payPeriodEnd')} />
            </div>
          </div>

          <LineItemsEditor
            idPrefix="earning"
            title="Earnings"
            hint="Basic pay, overtime, holiday pay, night differential, allowances."
            lines={form.earnings}
            options={EARNING_OPTIONS}
            onChange={(earnings) => onChange({ ...form, earnings })}
          />

          <LineItemsEditor
            idPrefix="deduction"
            title="Deductions"
            hint="SSS, PhilHealth, Pag-IBIG, withholding tax, loans, and anything else taken from your pay."
            lines={form.deductions}
            options={DEDUCTION_OPTIONS}
            onChange={(deductions) => onChange({ ...form, deductions })}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="statedNetPay">Net pay on your payslip</Label>
              <Input
                id="statedNetPay"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="text-right tabular-nums"
                value={form.statedNetPay}
                onChange={set('statedNetPay')}
                aria-describedby="statedNetPay-hint"
              />
              <p id="statedNetPay-hint" className="mt-1 text-xs text-muted-foreground">
                Used to check the payslip&apos;s math.
              </p>
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment date (optional)</Label>
              <Input id="paymentDate" type="date" value={form.paymentDate} onChange={set('paymentDate')} />
            </div>
          </div>

          {errors.length > 0 && (
            <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <p className="font-medium">Please fix the following:</p>
              <ul className="mt-1 list-disc pl-5">
                {errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          <Button type="submit" disabled={busy}>
            <Calculator className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Calculating...' : 'Calculate breakdown'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
