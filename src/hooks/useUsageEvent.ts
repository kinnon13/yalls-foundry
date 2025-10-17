/**
 * Usage Event Telemetry Hook
 * Logs user interactions to usage_events table
 */

import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

export function useUsageEvent() {
  const { session } = useSession();

  const logEvent = async (
    eventType: 'impression' | 'play' | 'click' | 'add_to_cart' | 'rsvp' | 'dwell' | 'like' | 'repost' | 'share',
    itemType: 'post' | 'listing' | 'event',
    itemId: string,
    metadata: Record<string, any> = {}
  ) => {
    try {
      const sessionId = sessionStorage.getItem('usage_session_id') || crypto.randomUUID();
      sessionStorage.setItem('usage_session_id', sessionId);

      // Use direct insert via any cast to bypass type checking for new table
      await (supabase as any).from('usage_events').insert({
        user_id: session?.userId || null,
        session_id: sessionId,
        event_type: eventType,
        item_type: itemType,
        item_id: itemId,
        metadata: metadata,
      });
    } catch (error) {
      console.error('Failed to log usage event:', error);
    }
  };

  return logEvent;
}
