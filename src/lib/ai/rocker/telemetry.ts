/**
 * Rocker Learning Telemetry
 * Tracks memory hits, learn mode sessions, and selector improvements
 */

import { supabase } from '@/integrations/supabase/client';

interface TelemetryEvent {
  event_type: 'memory_hit' | 'memory_miss' | 'learn_session' | 'selector_promoted' | 'selector_decay';
  route: string;
  target?: string;
  source?: 'user' | 'global' | 'heuristic';
  metadata?: Record<string, any>;
}

/**
 * Log a telemetry event for learning analytics
 */
export async function logTelemetry(event: TelemetryEvent): Promise<void> {
  try {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;
    
    const { error } = await supabase.from('ai_feedback').insert([{
      tenant_id: userId,
      user_id: userId,
      kind: 'telemetry',
      route: event.route,
      target: event.target || null,
      meta: {
        event_type: event.event_type,
        source: event.source,
        timestamp: new Date().toISOString(),
        ...event.metadata
      },
      payload: {} as any
    }]);
    
    if (error) {
      console.warn('[Telemetry] Failed to log:', error);
    }
  } catch (err) {
    console.warn('[Telemetry] Error:', err);
  }
}

/**
 * Track daily metrics aggregation
 */
export async function getDailyMetrics(date: string): Promise<{
  memory_hit_rate: { user: number; global: number; heuristic: number };
  learn_sessions: number;
  promotions: number;
  decays: number;
}> {
  try {
    const { data, error } = await supabase
      .from('ai_feedback')
      .select('*')
      .eq('kind', 'telemetry')
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);
    
    if (error || !data) {
      return { memory_hit_rate: { user: 0, global: 0, heuristic: 0 }, learn_sessions: 0, promotions: 0, decays: 0 };
    }
    
    const hits = data.filter(e => {
      const meta = e.meta as any;
      return meta?.event_type === 'memory_hit';
    });
    const total = hits.length || 1;
    
    return {
      memory_hit_rate: {
        user: hits.filter(e => (e.meta as any)?.source === 'user').length / total,
        global: hits.filter(e => (e.meta as any)?.source === 'global').length / total,
        heuristic: hits.filter(e => (e.meta as any)?.source === 'heuristic').length / total
      },
      learn_sessions: data.filter(e => (e.meta as any)?.event_type === 'learn_session').length,
      promotions: data.filter(e => (e.meta as any)?.event_type === 'selector_promoted').length,
      decays: data.filter(e => (e.meta as any)?.event_type === 'selector_decay').length
    };
  } catch (err) {
    console.warn('[Telemetry] Failed to get metrics:', err);
    return { memory_hit_rate: { user: 0, global: 0, heuristic: 0 }, learn_sessions: 0, promotions: 0, decays: 0 };
  }
}
