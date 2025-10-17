/**
 * Public Calendar Widget
 * Shows upcoming public events
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: any;
  host_entity_id: string;
}

export function PublicCalendar() {
  const { data: events = [] } = useQuery({
    queryKey: ['public-calendar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, starts_at, ends_at, location, host_entity_id')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as Event[];
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Upcoming Events</h2>
        <Link to="/events" className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No upcoming events
        </p>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Link
              key={event.id}
              to={`/events/${event.id}`}
              className="block p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors group"
            >
              <h3 className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {event.title}
              </h3>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Calendar size={12} />
                <span>{format(new Date(event.starts_at), 'MMM d, h:mm a')}</span>
              </div>

              {event.location && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin size={12} />
                  <span className="truncate">
                    {event.location.venue || event.location.city || 'Location TBA'}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
