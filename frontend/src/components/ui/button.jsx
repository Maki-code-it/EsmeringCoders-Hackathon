import { cva } from 'class-variance-authority';
import { cn } from '@/components/utils.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        outline: 'border border-input bg-card hover:bg-accent',
        ghost: 'hover:bg-accent',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export function Button({ className, variant, size, ...props }) {
  // Default to type="button" so a button inside a form never submits it by accident.
  // Submit buttons must say type="submit" explicitly.
  return <button type="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
