import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';

/** Optional from/to date filter for trends, analytics and reports. */
export default function RangeFilter({ range, onChange }) {
  const set = (key) => (e) => onChange({ ...range, [key]: e.target.value || undefined });
  const invalid = range.from && range.to && range.from > range.to;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">From</span>
        <Input type="date" value={range.from || ''} onChange={set('from')} className="h-9" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">To</span>
        <Input type="date" value={range.to || ''} onChange={set('to')} className="h-9" />
      </label>
      {(range.from || range.to) && (
        <Button variant="ghost" size="sm" onClick={() => onChange({})}>
          Clear dates
        </Button>
      )}
      {invalid && (
        <p role="alert" className="text-destructive">
          The start date must be before the end date.
        </p>
      )}
    </div>
  );
}
