/**
 * Calendar Widget
 * Public calendar preview in Feed pane right rail
 */

import { Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth/context';

interface CalendarEvent {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location?: string;
}

export function CalendarWidget() {
  const { session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.userId) {
      loadEvents();
    }
  }, [session?.userId]);

  const loadEvents = async () => {
    try {
      const now = new Date().toISOString();
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from('calendar_events')
        .select('id, title, starts_at, ends_at, location')
        .gte('starts_at', now)
        .lte('starts_at', nextWeek)
        .order('starts_at', { ascending: true })
        .limit(3);

      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatEventTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="border-border/40 bg-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Upcoming
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.length > 0 ? (
          <>
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2 p-2 rounded hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => window.location.href = `/calendar?event=${event.id}`}
              >
                <div className="text-xs text-muted-foreground w-16 shrink-0 pt-0.5">
                  {formatEventDate(event.starts_at)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatEventTime(event.starts_at)}
                    {event.location && ` • ${event.location}`}
                  </p>
                </div>
              </div>
            ))}
            
            <button 
              className="w-full text-xs text-primary hover:underline mt-2"
              onClick={() => window.location.href = '/calendar'}
            >
              View all events →
            </button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming events
          </p>
        )}
      </CardContent>
    </Card>
  );
}
