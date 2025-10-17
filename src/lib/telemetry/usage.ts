/**
 * Production-ready usage telemetry (PR5c)
 * Fire-and-forget event tracking for analytics
 */

import { supabase } from '@/integrations/supabase/client';

export type UsageEventType = 
  | 'impression' 
  | 'dwell_start' 
  | 'dwell_end' 
  | 'click' 
  | 'open' 
  | 'share' 
  | 'like' 
  | 'save' 
  | 'hide' 
  | 'report';

export type UsageEventInput = {
  sessionId: string;
  type: UsageEventType;
  surface: string; // 'home_foryou' | 'home_following' | 'home_shop' | 'dashboard_approvals'
  itemKind: 'post' | 'listing' | 'event' | 'feature';
  itemId: string;
  lane?: string | null;
  position?: number | null;
  durationMs?: number | null;
  meta?: Record<string, unknown>;
};

/**
 * Log a usage event (fire-and-forget)
 * Safe to call in render loops - no await needed
 */
export function logUsage(ev: UsageEventInput): void {
  (supabase as any)
    .rpc('log_usage_event_v2', {
      p_session_id: ev.sessionId,
      p_event_type: ev.type,
      p_surface: ev.surface,
      p_item_kind: ev.itemKind,
      p_item_id: ev.itemId,
      p_lane: ev.lane ?? null,
      p_position: ev.position ?? null,
      p_duration_ms: ev.durationMs ?? null,
      p_meta: sanitizeMeta(ev.meta),
    })
    .then(() => void 0)
    .catch(() => void 0);
}

/**
 * Sanitize metadata to prevent PII leakage and bloat
 */
function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | null {
  if (!meta) return null;
  
  const ALLOWED = ['experiment', 'variant', 'source', 'cta', 'screen', 'viewport'];
  const safe: Record<string, unknown> = {};
  
  for (const k of ALLOWED) {
    if (meta[k] !== undefined) safe[k] = meta[k];
  }
  
  const s = JSON.stringify(safe);
  return s.length > 1024 ? null : safe;
}

/**
 * Get or create a session ID for this browser session
 */
export function getSessionId(): string {
  const key = 'usage_session_id';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}
