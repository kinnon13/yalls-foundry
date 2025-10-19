/**
 * Telemetry Event Emitters
 * 
 * Centralized telemetry for tracking user interactions
 */

import { supabase } from '@/integrations/supabase/client';

type EventType = 
  | 'nav_footer_click'
  | 'search_result_click'
  | 'rocker_open'
  | 'rocker_message';

interface EventPayload {
  [key: string]: any;
}

/**
 * Emit a telemetry event to the backend
 */
export async function emitEvent(
  eventType: EventType,
  payload: EventPayload = {}
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[Telemetry] No user logged in, skipping event:', eventType);
      return;
    }

    const eventData = {
      user_id: user.id,
      event_type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      session_id: sessionStorage.getItem('session_id') || generateSessionId()
    };

    console.log('[Telemetry] Emitting event:', eventType, payload);

    // In production, you would send this to a telemetry service or database
    // For now, we'll use console logging
    // You can extend this to use Supabase realtime or a dedicated events table
    
    // Example: Insert into events table
    /*
    const { error } = await supabase
      .from('telemetry_events')
      .insert(eventData);
    
    if (error) {
      console.error('[Telemetry] Error inserting event:', error);
    }
    */
    
  } catch (error) {
    console.error('[Telemetry] Error emitting event:', error);
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('session_id', sessionId);
  return sessionId;
}

/**
 * Footer navigation click
 */
export function trackFooterClick(tab: string) {
  emitEvent('nav_footer_click', { tab });
}

/**
 * Search result click
 */
export function trackSearchResultClick(
  type: 'app' | 'user' | 'product' | 'video',
  itemId: string,
  action?: 'open' | 'install' | 'pin'
) {
  emitEvent('search_result_click', {
    type,
    [type === 'app' ? 'app_id' : 'item_id']: itemId,
    action
  });
}

/**
 * Rocker AI opened
 */
export function trackRockerOpen() {
  emitEvent('rocker_open', {});
}

/**
 * Rocker AI message sent
 */
export function trackRockerMessage(hasAction: boolean) {
  emitEvent('rocker_message', { has_action: hasAction });
}