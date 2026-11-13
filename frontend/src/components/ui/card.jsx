import { cn } from '@/components/utils.js';

/** Liquid-glass card. Styling lives in the `.glass` class in index.css. */
export function Card({ className, ...props }) {
  return <div className={cn('glass rounded-3xl text-card-foreground', className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 p-5 pb-2', className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-semibold leading-tight tracking-tight', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-2', className)} {...props} />;
}
