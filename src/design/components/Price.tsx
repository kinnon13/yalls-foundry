/**
 * Price Component - Consistent currency formatting
 */

import { cn } from '@/lib/utils';

interface PriceProps {
  cents: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-2xl',
};

export function Price({ cents, currency = 'USD', className, size = 'md' }: PriceProps) {
  const dollars = cents / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(dollars);

  return (
    <span className={cn('font-semibold tabular-nums', sizeClasses[size], className)}>
      {formatted}
    </span>
  );
}
