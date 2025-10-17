import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

let pvStart = performance.now();
let currentPath = '';

export function startPageView(path: string) {
  currentPath = path;
  pvStart = performance.now();
  log('page_view', { path });
}

export function endPageView() {
  if (!currentPath) return;
  const duration_ms = Math.round(performance.now() - pvStart);
  log('dwell_end', { path: currentPath, duration_ms });
}

async function log(event: string, meta: Record<string, unknown>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.rpc('log_usage_event_v2' as any, {
      p_session_id: crypto.randomUUID(),
      p_event_type: event,
      p_surface: currentPath || location.pathname + location.search,
      p_item_kind: 'page',
      p_item_id: crypto.randomUUID(),
      p_lane: null,
      p_position: null,
      p_duration_ms: (meta as any)?.duration_ms ?? null,
      p_meta: meta,
    });
  } catch {}
}

// React hook
export function usePageTelemetry() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    endPageView();
    startPageView(pathname + search);
    return () => endPageView();
  }, [pathname, search]);
}
