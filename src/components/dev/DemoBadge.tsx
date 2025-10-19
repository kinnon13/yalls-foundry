/**
 * Demo Badge (header indicator)
 * Shows when demo mode is active
 */

import { isDemo } from '@/lib/env';
import { AlertCircle } from 'lucide-react';

export function DemoBadge() {
  if (!isDemo()) return null;
  
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded text-xs font-medium">
      <AlertCircle className="h-3 w-3" />
      <span>DEMO</span>
    </div>
  );
}
