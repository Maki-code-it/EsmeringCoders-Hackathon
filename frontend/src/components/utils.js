import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * shadcn/ui class-name helper (JavaScript). Merges conditional Tailwind classes.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
