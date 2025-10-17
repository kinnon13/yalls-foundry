// PublicCalendar - Upcoming events widget for Home (PR5)
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function PublicCalendar() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['public-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events' as any)
        .select('id, title, starts_at, location')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No upcoming events scheduled
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event: any) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="block p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">{event.title}</h4>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(event.starts_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {typeof event.location === 'string' 
                        ? event.location 
                        : event.location?.name || 'Location TBA'}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {events.length > 0 && (
          <Link
            to="/events"
            className="block mt-4 text-sm text-primary hover:underline text-center"
          >
            View all events →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
