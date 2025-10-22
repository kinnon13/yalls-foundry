/**
 * Marketing Analytics - Client-side event tracking
 */

import { supabase } from '@/integrations/supabase/client';
import { traceId } from '@/lib/telemetry/trace';

export type MarketingEventType = 
  | 'home_impression'
  | 'cta_click'
  | 'signup_start'
  | 'signup_complete';

export interface LogEventPayload {
  variant: string;
  invite?: string | null;
  extras?: Record<string, any>;
}

/**
 * Log a marketing event to the database
 */
export async function logEvent(
  type: MarketingEventType,
  payload: LogEventPayload
): Promise<void> {
  const sessionId = getOrSetSession();
  const userAgent = navigator.userAgent;

  try {
    await supabase.from('marketing_events').insert({
      trace_id: traceId(),
      session_id: sessionId,
      event_type: type,
      variant: payload.variant,
      invite_code: payload.invite || null,
      referrer: document.referrer || null,
      user_agent: userAgent,
      extras: payload.extras || {},
    });
  } catch (error) {
    // Silent fail - don't break UX for analytics
    console.debug('Analytics event failed:', error);
  }
}

/**
 * Get or create session ID (stored in localStorage)
 */
function getOrSetSession(): string {
  const key = 'y_session_id';
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}
