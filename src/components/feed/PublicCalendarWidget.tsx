import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function PublicCalendarWidget() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['public-events-next5'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id,title,starts_at,location')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="rounded-xl border p-4 bg-card">
      <div className="text-sm font-medium mb-3">Upcoming Events</div>
      {isLoading && <div className="text-xs opacity-70">Loading…</div>}
      {!isLoading && !data.length && <div className="text-xs opacity-60">No upcoming events</div>}
      <div className="space-y-3">
        {data.map((e: any) => (
          <a key={e.id} href={`/events/${e.id}`} className="block hover:opacity-80 transition">
            <div className="text-sm font-medium">{e.title}</div>
            <div className="text-xs opacity-70">
              {new Date(e.starts_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              {e.location ? ` • ${typeof e.location === 'string' ? e.location : (e.location.name ?? '')}` : ''}
            </div>
          </a>
        ))}
      </div>
      {data.length > 0 && (
        <a href="/events" className="inline-block mt-3 text-xs opacity-80 hover:opacity-100 transition">
          View all →
        </a>
      )}
    </div>
  );
}
