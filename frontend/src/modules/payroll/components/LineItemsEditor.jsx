import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input, Select } from '@/components/ui/input.jsx';
import { newLine } from '../lib/payslipForm.js';

const MAX_LINES = 20;

/** Editable list of earning or deduction lines: category, description, amount. */
export default function LineItemsEditor({ title, hint, lines, options, onChange, idPrefix }) {
  const update = (key, field, value) =>
    onChange(lines.map((line) => (line.key === key ? { ...line, [field]: value } : line)));

  const remove = (key) => onChange(lines.filter((line) => line.key !== key));

  const add = () => onChange([...lines, newLine(options[options.length - 1].value)]);

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold">{title}</legend>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

      <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[11rem_1fr_9rem_2.5rem]">
        <span>Type</span>
        <span>Label on payslip</span>
        <span>Amount (PHP)</span>
        <span className="sr-only">Remove</span>
      </div>

      {lines.map((line, index) => {
        const rowLabel = `${title} row ${index + 1}`;
        return (
          <div key={line.key} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[11rem_1fr_9rem_2.5rem]">
            <Select
              id={`${idPrefix}-${line.key}-category`}
              aria-label={`${rowLabel} type`}
              value={line.category}
              onChange={(event) => update(line.key, 'category', event.target.value)}
              className="col-span-2 sm:col-span-1"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Input
              aria-label={`${rowLabel} label`}
              placeholder="Optional"
              maxLength={80}
              value={line.description}
              onChange={(event) => update(line.key, 'description', event.target.value)}
              className="col-span-2 sm:col-span-1"
            />
            <Input
              aria-label={`${rowLabel} amount`}
              type="number"
              inputMode="decimal"
              min="0"
              max="10000000"
              step="0.01"
              placeholder="0.00"
              value={line.amount}
              onChange={(event) => update(line.key, 'amount', event.target.value)}
              className="text-right tabular-nums"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(line.key)}
              aria-label={`Remove ${rowLabel}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        );
      })}

      <Button type="button" variant="outline" size="sm" onClick={add} disabled={lines.length >= MAX_LINES}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add line
      </Button>
    </fieldset>
  );
}
