/**
 * Page View Tracking Hook
 * Auto-logs page views on route changes
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function usePageView() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const path = pathname + search;
    
    // Log page view via usage_events
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return; // Skip for anonymous

      await supabase.rpc('log_usage_event_v2', {
        p_session_id: crypto.randomUUID(),
        p_event_type: 'page_view',
        p_surface: path,
        p_item_kind: 'page',
        p_item_id: crypto.randomUUID(),
        p_lane: null,
        p_position: null,
        p_duration_ms: null,
        p_meta: { path },
      });
    })();
  }, [pathname, search]);
}
