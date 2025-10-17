/**
 * Usage Telemetry - Production-Grade Event Tracking
 * Logs user interactions with proper rate limiting and sanitization
 */

import { supabase } from '@/integrations/supabase/client';

const ALLOWED_META_KEYS = ['experiment', 'variant', 'source', 'cta', 'screen', 'viewport'];
const MAX_META_SIZE = 1024; // 1KB cap

let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('usage_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('usage_session_id', sessionId);
    }
  }
  return sessionId;
}

function sanitizeMeta(meta?: Record<string, unknown>): Record<string, unknown> | null {
  if (!meta) return null;
  
  const safe: Record<string, unknown> = {};
  for (const key of ALLOWED_META_KEYS) {
    if (meta[key] !== undefined) {
      safe[key] = meta[key];
    }
  }
  
  const serialized = JSON.stringify(safe);
  if (serialized.length > MAX_META_SIZE) {
    console.warn('[Telemetry] Meta size exceeds 1KB, dropping');
    return null;
  }
  
  return safe;
}

interface LogUsageParams {
  sessionId: string;
  type: 'impression' | 'dwell_start' | 'dwell_end' | 'click' | 'open' | 'share' | 'like' | 'save' | 'hide' | 'report';
  surface: string;
  itemKind: 'post' | 'listing' | 'event';
  itemId: string;
  lane: string | null;
  position?: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
}

export async function logUsage(params: LogUsageParams): Promise<void> {
  try {
    const safeMeta = sanitizeMeta(params.meta);
    
    await supabase.rpc('log_usage_event_v2', {
      p_session_id: params.sessionId,
      p_event_type: params.type,
      p_surface: params.surface,
      p_item_kind: params.itemKind,
      p_item_id: params.itemId,
      p_lane: params.lane,
      p_position: params.position ?? null,
      p_duration_ms: params.durationMs ?? null,
      p_meta: safeMeta ? JSON.stringify(safeMeta) : '{}'
    });
  } catch (error) {
    // Fire-and-forget: never block UX
    console.error('[Telemetry] Failed to log usage:', error);
  }
}

export function logImpression(surface: string, itemKind: 'post' | 'listing' | 'event', itemId: string, position: number, lane?: string): void {
  logUsage({
    sessionId: getSessionId(),
    type: 'impression',
    surface,
    itemKind,
    itemId,
    lane: lane ?? null,
    position
  });
}

export function logClick(surface: string, itemKind: 'post' | 'listing' | 'event', itemId: string): void {
  logUsage({
    sessionId: getSessionId(),
    type: 'click',
    surface,
    itemKind,
    itemId,
    lane: null
  });
}
