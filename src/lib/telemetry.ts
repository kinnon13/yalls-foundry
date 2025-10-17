import { supabase } from '@/integrations/supabase/client';

let pvStart = performance.now();
let currentPath = '';

export function startPageView(path: string) {
  currentPath = path;
  pvStart = performance.now();
  log('page_view', { path });
}

export function endPageView() {
  const dur = Math.round(performance.now() - pvStart);
  if (currentPath) log('dwell_end', { path: currentPath, duration_ms: dur });
}

async function log(event: string, meta: Record<string, unknown>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase.rpc as any)('log_usage_event_v2', {
      p_session_id: crypto.randomUUID(),
      p_event_type: event,
      p_surface: currentPath || location.pathname + location.search,
      p_item_kind: 'page',
      p_item_id: crypto.randomUUID(),
      p_lane: null,
      p_position: null,
      p_duration_ms: meta['duration_ms'] ?? null,
      p_meta: meta
    });
  } catch {}
}
