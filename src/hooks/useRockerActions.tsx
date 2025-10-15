/**
 * useRockerActions Hook
 * 
 * React hook for subscribing to Rocker actions in UI components.
 * Displays suggestions, notifications, and AI-driven interactions.
 */

import { useEffect, useState } from 'react';
import { rockerBus, RockerAction } from '@/lib/ai/rocker/bus';
import { useToast } from '@/hooks/use-toast';

export function useRockerActions() {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<RockerAction[]>([]);
  const [notifications, setNotifications] = useState<RockerAction[]>([]);

  useEffect(() => {
    const unsubscribe = rockerBus.onAction((action) => {
      console.log('[RockerActions] Received action:', action);

      // Handle different action types
      switch (action.type) {
        case 'suggest.tag':
        case 'suggest.link':
        case 'suggest.follow':
        case 'suggest.listing':
        case 'suggest.event':
          // Store as suggestions
          setSuggestions(prev => [...prev, action]);
          break;

        case 'notify.user':
          // Show as toast notification
          toast({
            title: action.payload.title || 'Rocker Notification',
            description: action.payload.message,
          });
          setNotifications(prev => [...prev, action]);
          break;

        case 'update.memory':
          // Silent - memory updated in background
          console.log('[Rocker] Memory updated:', action.payload);
          break;

        case 'analyze.media':
          // Show analysis results
          toast({
            title: 'Media Analysis Complete',
            description: action.payload.summary || 'Rocker analyzed your media',
          });
          break;

        case 'verify.data':
          // Request user verification
          setSuggestions(prev => [...prev, action]);
          toast({
            title: 'Verification Needed',
            description: action.payload.message || 'Please verify this information',
          });
          break;

        default:
          console.warn('[RockerActions] Unhandled action type:', action.type);
      }
    });

    return unsubscribe;
  }, [toast]);

  const dismissSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const dismissAllSuggestions = () => {
    setSuggestions([]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    suggestions,
    notifications,
    dismissSuggestion,
    dismissAllSuggestions,
    clearNotifications,
  };
}
