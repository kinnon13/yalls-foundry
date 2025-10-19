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
  | 'rocker_message'
  | 'auth_view'
  | 'auth_submit'
  | 'auth_success'
  | 'auth_error'
  | 'auth_rate_limited'
  | 'auth_captcha_shown'
  | 'auth_captcha_pass'
  | 'auth_captcha_fail'
  | 'onboarding_step'
  | 'onboarding_complete'
  | 'acquisition_capture';

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
    
    // Allow some events without auth (e.g., auth_view before login)
    const allowAnonymous = ['auth_view', 'auth_submit', 'auth_error'].includes(eventType);
    
    if (!user && !allowAnonymous) {
      console.warn('[Telemetry] No user logged in, skipping event:', eventType);
      return;
    }

    const session_id = sessionStorage.getItem('session_id') || generateSessionId();

    // Insert into rocker_events table
    const { error } = await supabase
      .from('rocker_events')
      .insert([{
        user_id: user?.id || null,
        event_type: eventType,
        payload: payload as any,
        session_id
      }] as any);
    
    if (error) {
      console.error('[Telemetry] Error inserting event:', error);
    } else {
      console.log('[Telemetry] Event logged:', eventType, payload);
    }
    
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