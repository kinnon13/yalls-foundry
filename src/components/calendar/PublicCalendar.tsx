/**
 * Public Calendar Widget
 * Shows upcoming events for discovery
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function PublicCalendar() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['public-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar size={18} />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events && events.length > 0 ? (
          events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <p className="font-medium text-sm mb-1 line-clamp-1">{event.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar size={12} />
                <span>{format(new Date(event.starts_at), 'MMM d, h:mm a')}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <MapPin size={12} />
                  <span className="line-clamp-1">
                    {typeof event.location === 'string' 
                      ? event.location 
                      : (event.location as any).name || 'Location TBD'}
                  </span>
                </div>
              )}
            </Link>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming events
          </p>
        )}
        <Link
          to="/events"
          className="block text-center text-sm text-primary hover:underline mt-2"
        >
          View all events →
        </Link>
      </CardContent>
    </Card>
  );
}
