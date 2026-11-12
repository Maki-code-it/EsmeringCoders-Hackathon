/** Optional from/to date filter for trends, analytics and reports. */
export default function RangeFilter({ range, onChange }) {
  const set = (key) => (e) => onChange({ ...range, [key]: e.target.value || undefined });
  const invalid = range.from && range.to && range.from > range.to;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">From</span>
        <input type="date" value={range.from || ''} onChange={set('from')} className="h-9 rounded-lg border bg-card px-2" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-muted-foreground">To</span>
        <input type="date" value={range.to || ''} onChange={set('to')} className="h-9 rounded-lg border bg-card px-2" />
      </label>
      {(range.from || range.to) && (
        <button type="button" className="h-9 rounded-lg px-3 hover:bg-accent" onClick={() => onChange({})}>
          Clear dates
        </button>
      )}
      {invalid && (
        <p role="alert" className="text-red-600">
          The start date must be before the end date.
        </p>
      )}
    </div>
  );
}
