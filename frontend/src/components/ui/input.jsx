import { cn } from '@/components/utils.js';

// Recessed glass well (.glass-field in index.css).
const fieldClasses =
  'glass-field h-10 w-full rounded-xl px-3.5 text-sm outline-none transition-[background-color,border-color,box-shadow] placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 aria-[invalid=true]:border-destructive';

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
  return <label className={cn('mb-1.5 block text-sm font-medium text-foreground/80', className)} {...props} />;
}
