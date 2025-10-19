/**
 * Pinboard Component
 * Display pinned apps for current context
 */

import { usePinboard, PRODUCER_PRE_PINS } from '@/library/pinboard';
import { useContextManager } from '@/kernel/context-manager';
import { libraryRegistry } from '@/library/registry';
import { useLockedPins } from '@/hooks/useLockedPins';
import { PinTile } from './PinTile';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { AppId } from '@/kernel/types';

interface PinboardProps {
  contextId?: string;
}

export function Pinboard({ contextId }: PinboardProps) {
  const { activeId, activeType } = useContextManager();
  const { getPins, unpin: unpinLocal } = usePinboard();
  const { pins: dbPins, loading, unpin: unpinDb, incrementUse, isLocked } = useLockedPins();
  
  const id = contextId || activeId || 'home';
  const localPins = getPins(id);
  
  // Merge DB pins (for entities) with local pins (for apps)
  const entityPins = dbPins.filter(p => p.pinType === 'entity');
  
  // Show pre-pins for business/producer contexts if no pins exist
  const isBusinessContext = activeType === 'business' || activeType === 'producer';
  const hasPins = localPins.length > 0 || entityPins.length > 0;
  const showPrePins = isBusinessContext && !hasPins;

  return (
    <div className="p-4 space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground mb-3">
        {isBusinessContext ? 'Business Tools' : 'Pinned Apps'}
      </h3>
      
      {!loading && !hasPins && !showPrePins && (
        <p className="text-sm text-muted-foreground">No pinned apps. Search and click to pin.</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {/* Entity pins from DB */}
        {entityPins.map((pin) => (
          <PinTile
            key={pin.id}
            pin={pin}
            locked={isLocked(pin)}
            onRemove={() => unpinDb(pin.id)}
            onClick={() => {
              incrementUse(pin.id);
              // Navigate to entity
              window.location.href = `/profile/${pin.refId}`;
            }}
          />
        ))}

        {/* Local app pins */}
        {localPins.map((pin) => {
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
                  unpinLocal(pin.appId, id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}

        {/* Pre-pins for business context */}
        {showPrePins && PRODUCER_PRE_PINS.map((appId, i) => {
          const entry = libraryRegistry.get(appId);
          if (!entry) return null;

          return (
            <div
              key={appId}
              className="relative p-3 border rounded-lg hover:bg-accent cursor-pointer group"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium text-sm">{entry.contract.name}</span>
                <span className="text-xs text-muted-foreground">
                  {entry.contract.intents[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
