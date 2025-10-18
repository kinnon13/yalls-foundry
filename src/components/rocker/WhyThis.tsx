/**
 * WhyThis Component
 * Tooltip explaining Rocker suggestion rationale
 */

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WhyThisProps {
  reason: string;
}

export function WhyThis({ reason }: WhyThisProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 transition-colors">
            <HelpCircle className="h-3 w-3 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
