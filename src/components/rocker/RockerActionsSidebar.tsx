/**
 * Sidebar showing proactive Rocker AI suggestions
 * Displays real-time actions from the event bus
 */

import { useRockerActions } from '@/hooks/useRockerActions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Sparkles } from 'lucide-react';

export function RockerActionsSidebar() {
  const { actions, dismissAction, clearAll } = useRockerActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="fixed right-4 top-20 w-80 space-y-2 z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Rocker Suggestions
        </h3>
        {actions.length > 1 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAll}
          >
            Clear All
          </Button>
        )}
      </div>
      
      {actions.map((action, index) => (
        <Card key={index} className="p-4 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={() => dismissAction(index)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className="pr-8">
            <p className="text-sm font-medium mb-1">{action.type}</p>
            <p className="text-xs text-muted-foreground">
              {action.payload.message || JSON.stringify(action.payload)}
            </p>
            
            {action.payload.cta && (
              <Button 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => {
                  // Handle CTA action
                  if (action.payload.href) {
                    window.location.href = action.payload.href;
                  }
                  dismissAction(index);
                }}
              >
                {action.payload.cta}
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
