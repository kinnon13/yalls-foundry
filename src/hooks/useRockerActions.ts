/**
 * React hook to subscribe to Rocker AI actions and suggestions
 * Displays real-time proactive suggestions from the AI
 */

import { useEffect, useState } from 'react';
import { rockerBus, type RockerAction } from '@/lib/ai/rocker/bus';
import { useToast } from '@/hooks/use-toast';

export function useRockerActions() {
  const [actions, setActions] = useState<RockerAction[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to Rocker actions
    const unsubscribe = rockerBus.onAction((action) => {
      console.log('[useRockerActions] Received action:', action);
      
      // Add to state
      setActions(prev => [...prev, action]);
      
      // Show toast for high-priority actions
      if (action.priority === 'high' || action.priority === 'critical') {
        toast({
          title: 'Rocker Suggestion',
          description: action.payload.message || 'New suggestion available',
        });
      }
    });

    return unsubscribe;
  }, [toast]);

  const dismissAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setActions([]);
  };

  return {
    actions,
    dismissAction,
    clearAll,
  };
}
