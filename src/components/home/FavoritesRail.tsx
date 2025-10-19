/**
 * Favorites Rail
 * Sticky horizontal rail with profile + favorited apps
 * Shows 8 placeholders when empty + "+ Add" picker
 */

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePinboard } from '@/library/pinboard';
import { useContextManager } from '@/kernel/context-manager';
import { libraryRegistry } from '@/library/registry';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function FavoritesRail() {
  const [showPicker, setShowPicker] = useState(false);
  const { getPins, pin } = usePinboard();
  const { activeId, activeType } = useContextManager();
  const navigate = useNavigate();
  
  const contextId = activeId || 'home';
  const pins = getPins(contextId);
  const allApps = libraryRegistry.getAll();

  const placeholders = Array.from({ length: Math.max(0, 8 - pins.length) }, (_, i) => i);

  const handleAppClick = (appId: string) => {
    navigate(`/?app=${appId}`);
  };

  const handleAddApp = (appId: string) => {
    pin(appId, activeType, contextId);
    setShowPicker(false);
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {/* Profile bubble */}
        <Avatar className="h-12 w-12 shrink-0 cursor-pointer hover:ring-2 hover:ring-primary">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback>ME</AvatarFallback>
        </Avatar>

        {/* Pinned apps */}
        {pins.map((pin) => {
          const entry = libraryRegistry.get(pin.appId);
          if (!entry) return null;
          
          return (
            <Button
              key={pin.appId}
              variant="ghost"
              size="sm"
              className="h-12 w-12 shrink-0 p-0 rounded-full"
              onClick={() => handleAppClick(pin.appId)}
            >
              <div className="flex items-center justify-center h-full w-full rounded-full bg-primary/10">
                <span className="text-xs font-medium">{entry.contract.name.slice(0, 2)}</span>
              </div>
            </Button>
          );
        })}

        {/* Placeholders */}
        {placeholders.map((i) => (
          <div
            key={`placeholder-${i}`}
            className="h-12 w-12 shrink-0 rounded-full border-2 border-dashed border-muted-foreground/20"
          />
        ))}

        {/* Add button */}
        <Dialog open={showPicker} onOpenChange={setShowPicker}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-12 w-12 shrink-0 p-0 rounded-full border-2 border-dashed hover:border-primary"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Favorites</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 gap-2">
                {allApps
                  .filter((app) => !pins.some((p) => p.appId === app.contract.id))
                  .map((entry) => (
                    <Button
                      key={entry.contract.id}
                      variant="outline"
                      className="h-20 flex flex-col gap-1"
                      onClick={() => handleAddApp(entry.contract.id)}
                    >
                      <span className="font-medium">{entry.contract.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {entry.contract.intents[0]}
                      </span>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
