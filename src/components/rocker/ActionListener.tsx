/**
 * Action Listener Component
 * Subscribes to Rocker actions and handles them in context
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rockerBus } from '@/lib/ai/rocker/bus';
import { useToast } from '@/hooks/use-toast';

interface ActionListenerProps {
  /**
   * Filter actions by type prefix (e.g., 'suggest.follow' for profile page)
   */
  filter?: string;
  /**
   * Custom action handler
   */
  onAction?: (action: any) => void;
}

export function ActionListener({ filter, onAction }: ActionListenerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = rockerBus.onAction((action) => {
      // Filter if specified
      if (filter && !action.type.startsWith(filter)) {
        return;
      }

      console.log('[ActionListener] Received action:', action);

      // Call custom handler if provided
      if (onAction) {
        onAction(action);
        return;
      }

      // Default handlers for common actions
      switch (action.type) {
        case 'suggest.follow':
          if (action.payload.user_id) {
            toast({
              title: 'Follow Suggestion',
              description: action.payload.message || `Consider following ${action.payload.user_name}`,
            });
            // Navigate after short delay
            setTimeout(() => navigate(`/profile/${action.payload.user_id}`), 2000);
          }
          break;

        case 'suggest.listing':
          if (action.payload.listing_id) {
            toast({
              title: 'Listing Recommendation',
              description: action.payload.message || 'Check out this listing',
            });
            setTimeout(() => navigate(`/marketplace?listing=${action.payload.listing_id}`), 2000);
          }
          break;

        case 'suggest.event':
          if (action.payload.event_id) {
            toast({
              title: 'Event Suggestion',
              description: action.payload.message || 'You might be interested in this event',
            });
            setTimeout(() => navigate(`/calendar?event=${action.payload.event_id}`), 2000);
          }
          break;

        case 'suggest.tag':
          toast({
            title: 'Tag Suggestions',
            description: action.payload.message || 'Consider adding these tags',
          });
          break;

        default:
          // Log unknown action types
          console.log('[ActionListener] Unhandled action type:', action.type);
      }
    });

    return unsubscribe;
  }, [filter, onAction, navigate, toast]);

  return null; // This is a logical component, no UI
}
