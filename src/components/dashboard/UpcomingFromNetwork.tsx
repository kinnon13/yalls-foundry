import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRocker } from '@/lib/ai/rocker';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { RockerHint } from '@/lib/ai/rocker';

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
      
      // Use functions.invoke until types regenerate
      const { data, error } = await supabase.functions.invoke('get_dashboard_upcoming_events', {
        body: { p_user_id: uid, p_horizon: '30d' }
      });
      
      if (error) throw error;
      return Array.isArray(data) ? data : (data ? [data] : []);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming from your network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded border p-3">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming from your network</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load events.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming from your network</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            No upcoming events yet. Follow organizers to see their events here.
          </p>
          <RockerHint
            suggestion="Follow 3 organizers to see events here"
            reason="Building your network helps you discover relevant events"
            action={async () => {
              window.location.href = '/search?category=events';
            }}
            actionLabel="Find Organizers"
            rateLimit="hint:follow-organizers:v1"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming from your network
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.map((ev: any) => (
          <div key={ev.event_id} className="rounded border p-3 flex flex-col gap-2 hover:border-primary/50 transition-colors">
            <div className="font-medium">{ev.title}</div>
            <div className="text-sm text-muted-foreground">
              {new Date(ev.starts_at).toLocaleString()}
            </div>
            {ev.location && (
              <div className="text-xs text-muted-foreground">
                {typeof ev.location === 'string' ? ev.location : ev.location.name || 'Location TBD'}
              </div>
            )}
            {ev.enterable ? (
              <Button 
                asChild 
                size="sm"
                onClick={() => log('enter_event_click', { event_id: ev.event_id })}
              >
                <Link to={ev.enter_route!}>Enter</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/events/${ev.event_id}`}>View Details</Link>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
