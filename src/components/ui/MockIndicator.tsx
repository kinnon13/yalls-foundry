/**
 * Mock Data Indicator
 * Shows 🚩 for all mock/test data throughout the app
 */

import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockIndicatorProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'overlay' | 'inline';
}

const sizeClasses = {
  xs: 'w-3 h-3 text-[8px]',
  sm: 'w-4 h-4 text-[10px]',
  md: 'w-5 h-5 text-xs',
  lg: 'w-6 h-6 text-sm',
};

export function MockIndicator({ className, size = 'sm', variant = 'badge' }: MockIndicatorProps) {
  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'absolute -top-1 -right-1 z-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg',
          sizeClasses[size],
          className
        )}
        title="Mock/Test Data"
      >
        🚩
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center text-red-500 font-bold',
          sizeClasses[size],
          className
        )}
        title="Mock/Test Data"
      >
        🚩
      </span>
    );
  }

  // badge variant (default)
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center bg-red-500 text-white rounded-full font-bold shadow-md',
        sizeClasses[size],
        className
      )}
      title="Mock/Test Data"
    >
      🚩
    </span>
  );
}
