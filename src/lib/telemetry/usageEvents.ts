// Usage event telemetry helper (PR5c)
import { supabase } from '@/integrations/supabase/client';
import type { FeedItem } from '@/types/feed';

export type UsageEventType = 
  | 'feed_view' 
  | 'impression' 
  | 'click' 
  | 'add_to_cart' 
  | 'rsvp' 
  | 'dwell';

interface LogEventParams {
  eventType: UsageEventType;
  itemType?: FeedItem['kind'];
  itemId?: string;
  payload?: Record<string, any>;
}

/**
 * Log a usage event to the telemetry table.
 * Non-blocking - errors are logged but don't throw.
 */
export async function logUsageEvent({
  eventType,
  itemType,
  itemId,
  payload = {}
}: LogEventParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;

    await (supabase as any).from('usage_events').insert({
      user_id: user.id,
      event_type: eventType,
      item_type: itemType,
      item_id: itemId,
      payload: payload,
    });
  } catch (error) {
    console.warn('[Telemetry] Failed to log event:', eventType, error);
  }
}

/**
 * Create a dwell timer that logs when unmounted or time threshold reached.
 */
export function createDwellTimer(
  item: FeedItem,
  thresholdMs: number = 3000
): () => void {
  const startTime = Date.now();
  let logged = false;

  const logDwell = () => {
    if (logged) return;
    logged = true;
    const dwellMs = Date.now() - startTime;
    if (dwellMs >= thresholdMs) {
      logUsageEvent({
        eventType: 'dwell',
        itemType: item.kind,
        itemId: item.id,
        payload: { dwell_ms: dwellMs }
      });
    }
  };

  return logDwell;
}
