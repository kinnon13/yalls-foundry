/**
 * Upcoming Events Row
 * Horizontal scrolling section showing public events from followed businesses/profiles
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export function UpcomingEventsRow() {
  const { session } = useSession();

  const { data: events, isLoading } = useQuery({
    queryKey: ['upcoming-events', session?.userId],
    queryFn: async () => {
      // Get upcoming public events (simplified - no follows filtering for now)
      const { data, error } = await supabase
        .from('calendar_events')
        .select(`
          *,
          calendar:calendars!inner(
            owner_profile_id,
            visibility
          )
        `)
        .gte('starts_at', new Date().toISOString())
        .eq('calendar.visibility', 'public')
        .order('starts_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.userId,
  });

  if (!session || isLoading || !events || events.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          Upcoming Events
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard?tab=calendar">View All</Link>
        </Button>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {events.map((event) => (
            <Card key={event.id} className="w-80 flex-shrink-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(event.starts_at).toLocaleDateString()}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/dashboard?tab=calendar&eventId=${event.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}