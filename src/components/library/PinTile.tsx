/**
 * Pin Tile Component
 * Shows app pins with lock state
 */

import { Button } from '@/components/ui/button';
import { X, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { AppPin } from '@/hooks/useLockedPins';

interface PinTileProps {
  pin: AppPin;
  locked: boolean;
  onRemove: () => void;
  onClick?: () => void;
}

export function PinTile({ pin, locked, onRemove, onClick }: PinTileProps) {
  const daysUntilUnlock = locked && pin.lockedUntil
    ? Math.ceil((new Date(pin.lockedUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div
      className="relative p-3 border rounded-lg hover:bg-accent cursor-pointer group transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {locked && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto-added · unlocks in {daysUntilUnlock} day{daysUntilUnlock === 1 ? '' : 's'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span className="font-medium text-sm">{pin.title || pin.refId}</span>
        </div>
        
        {locked && (
          <span className="text-xs text-muted-foreground">
            Auto-added · unlocks in {daysUntilUnlock} day{daysUntilUnlock === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {locked ? (
              <p>Auto-added for quick access. Unlocks in {daysUntilUnlock} day{daysUntilUnlock === 1 ? '' : 's'}.</p>
            ) : (
              <p>Remove pin</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
