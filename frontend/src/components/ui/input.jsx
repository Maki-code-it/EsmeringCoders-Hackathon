import { cn } from '@/components/utils.js';

const fieldClasses =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 aria-[invalid=true]:border-destructive';

export function Input({ className, ...props }) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(fieldClasses, 'pr-8', className)} {...props}>
      {children}
    </select>
  );
}

export function Label({ className, ...props }) {
  // eslint-disable-next-line jsx-a11y/label-has-associated-control
  return <label className={cn('mb-1 block text-xs font-medium text-muted-foreground', className)} {...props} />;
}
