/**
 * RockerWhy - Tiny "why?" tooltip component
 */

import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRocker } from './RockerProvider';

interface RockerWhyProps {
  reason: string;
}

export function RockerWhy({ reason }: RockerWhyProps) {
  const { why } = useRocker();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full w-4 h-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Why this suggestion?"
          >
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {why(reason)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
