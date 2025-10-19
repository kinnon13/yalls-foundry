/**
 * Pinboard Component
 * Display pinned apps for current context
 */

import { usePinboard } from '@/library/pinboard';
import { useContextManager } from '@/kernel/context-manager';
import { libraryRegistry } from '@/library/registry';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PinboardProps {
  contextId?: string;
}

export function Pinboard({ contextId }: PinboardProps) {
  const { activeId } = useContextManager();
  const { getPins, unpin } = usePinboard();
  
  const id = contextId || activeId || 'home';
  const pins = getPins(id);

  return (
    <div className="p-4 space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground mb-3">Pinned Apps</h3>
      
      {pins.length === 0 && (
        <p className="text-sm text-muted-foreground">No pinned apps. Search and click to pin.</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {pins.map((pin) => {
          const entry = libraryRegistry.get(pin.appId);
          if (!entry) return null;

          return (
            <div
              key={pin.appId}
              className="relative p-3 border rounded-lg hover:bg-accent cursor-pointer group"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{entry.contract.name}</span>
                <span className="text-xs text-muted-foreground">
                  {entry.contract.intents[0]}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  unpin(pin.appId, id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
