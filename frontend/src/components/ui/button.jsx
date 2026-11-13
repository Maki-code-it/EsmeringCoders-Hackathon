import { cva } from 'class-variance-authority';
import { cn } from '@/components/utils.js';

// Capsule-shaped glass buttons. Surfaces come from index.css (.glass-*).
const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 rounded-full text-sm font-medium transition-[background-color,box-shadow,filter,transform] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'glass-tinted',
        secondary: 'glass-control text-secondary-foreground',
        outline: 'glass-control',
        ghost: 'border border-transparent hover:bg-white/45 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.8)]',
      },
      size: {
        default: 'h-10 px-5',
        sm: 'h-8 px-3.5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export function Button({ className, variant, size, ...props }) {
  // Default to type="button" so a button inside a form never submits it by accident. Submit buttons must say type="submit" explicitly.
  return <button type="button" className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
