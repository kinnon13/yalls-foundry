import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRocker } from '@/lib/ai/rocker';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';

export function UpcomingFromNetwork() {
  const { log, section } = useRocker();

  useEffect(() => {
    log('page_view', { section, component: 'upcoming_from_network' });
  }, [log, section]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dash', 'upcoming-network'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user.id;
      if (!uid) return [];

      // Defensive fetch with multiple fallbacks
      // 1) Try edge function
      try {
        const { data, error } = await supabase.functions.invoke('get_dashboard_upcoming_events', {
          body: { p_user_id: uid, p_horizon: '30d' }
        });
        if (!error && Array.isArray(data)) return data;
        if (!error && data) return [data];
      } catch (_) {
        // Swallow 404/network errors and fall back
      }

      // 2) Fallback: direct table query (public upcoming next 30d)
      const { data: events } = await supabase
        .from('events')
        .select('id, title, starts_at, location')
        .gte('starts_at', new Date().toISOString())
        .lte('starts_at', new Date(Date.now() + 30 * 864e5).toISOString())
        .order('starts_at', { ascending: true })
        .limit(6);

      return (events || []).map(ev => ({
        event_id: ev.id,
        entity_id: null, // Not available in fallback
        title: ev.title,
        starts_at: ev.starts_at,
        location: ev.location,
        image: null,
        enterable: true,
        enter_route: `/events/${ev.id}/enter`
      }));
    }
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-lg font-semibold px-2">Upcoming</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-muted/30 backdrop-blur-sm p-4 h-28" />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data || data.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold px-2 flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Upcoming
      </h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.slice(0, 6).map((ev: any) => (
          <Link
            key={ev.event_id}
            to={ev.enterable ? ev.enter_route! : `/events/${ev.event_id}`}
            className="rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-4 flex flex-col gap-2 hover:bg-card/80 hover:scale-[1.02] transition-all hover:shadow-lg"
            onClick={() => log('enter_event_click', { event_id: ev.event_id })}
          >
            <div className="font-medium line-clamp-2">{ev.title}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(ev.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
            {ev.location && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {typeof ev.location === 'string' ? ev.location : ev.location.name || 'Location TBD'}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
