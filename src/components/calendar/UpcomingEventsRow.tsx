/**
 * Upcoming Events Row
 * 
 * Horizontal scrolling rail showing upcoming public events + events from follows
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Calendar, MapPin, Plus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  host_profile_id: string;
  visibility: 'public' | 'followers' | 'private';
  location?: any;
  description?: string;
}

export function UpcomingEventsRow() {
  const { session } = useSession();
  const { toast } = useToast();
  const [showFromFollows, setShowFromFollows] = useState(false);
  const [addedEvents, setAddedEvents] = useState<Set<string>>(new Set());

  // Fetch public upcoming events (works for all users)
  const { data: publicEvents, isLoading: loadingPublic } = useQuery({
    queryKey: ['events-public-upcoming'],
    queryFn: async () => {
      // @ts-expect-error - RPC function not yet in generated types
      const { data, error } = await supabase.rpc('events_public_upcoming', {
        days: 30,
        limit_count: 50
      });
      if (error) throw error;
      return (data || []) as Event[];
    }
  });

  // Fetch events from followed profiles (auth only)
  const { data: followedEvents, isLoading: loadingFollowed } = useQuery({
    queryKey: ['events-from-follows-upcoming'],
    queryFn: async () => {
      // @ts-expect-error - RPC function not yet in generated types
      const { data, error } = await supabase.rpc('events_from_follows_upcoming', {
        days: 30,
        limit_count: 50
      });
      if (error) throw error;
      return (data || []) as Event[];
    },
    enabled: !!session?.userId
  });

  // Fetch user's saved calendar events
  const { data: savedEvents } = useQuery({
    queryKey: ['calendar-events', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('calendar_events')
        .select('id, title, starts_at, ends_at, location, event_type')
        .eq('created_by', session!.userId);
      return new Set((data || []).map(e => e.id));
    },
    enabled: !!session?.userId
  });

  const handleAddToCalendar = async (eventId: string) => {
    if (!session?.userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add events to your calendar",
        variant: "destructive"
      });
      return;
    }

    try {
      // @ts-expect-error - RPC function not yet in generated types
      const { error } = await supabase.rpc('calendar_add_event', {
        p_event_id: eventId,
        p_source: 'feed'
      });

      if (error) throw error;

      setAddedEvents(prev => new Set([...prev, eventId]));
      toast({
        title: "Added to calendar",
        description: "Event saved to your personal calendar",
      });
    } catch (error) {
      console.error('Error adding event:', error);
      toast({
        title: "Error",
        description: "Failed to add event to calendar",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromCalendar = async (eventId: string) => {
    if (!session?.userId) return;

    try {
      // @ts-expect-error - RPC function not yet in generated types
      const { error } = await supabase.rpc('calendar_remove_event', {
        p_event_id: eventId
      });

      if (error) throw error;

      setAddedEvents(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      toast({
        title: "Removed from calendar",
        description: "Event removed from your calendar",
      });
    } catch (error) {
      console.error('Error removing event:', error);
      toast({
        title: "Error",
        description: "Failed to remove event from calendar",
        variant: "destructive"
      });
    }
  };

  // Merge and dedupe events
  const displayEvents = showFromFollows && followedEvents
    ? followedEvents
    : publicEvents || [];

  const isLoading = showFromFollows ? loadingFollowed : loadingPublic;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </Card>
    );
  }

  if (!displayEvents || displayEvents.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
        </div>
        <div className="flex gap-2">
          {session?.userId && followedEvents && followedEvents.length > 0 && (
            <Button
              variant={showFromFollows ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFromFollows(!showFromFollows)}
            >
              From Follows
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/search?type=event&scope=${showFromFollows ? 'follows' : 'public'}`}>
              View All
            </Link>
          </Button>
        </div>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          {displayEvents.map((event) => {
            const isInCalendar = savedEvents?.has(event.id) || addedEvents.has(event.id);
            
            return (
              <Card
                key={event.id}
                className="flex-shrink-0 w-[300px] p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('eventId', event.id);
                  url.searchParams.set('from', showFromFollows ? 'follows' : 'public');
                  window.history.replaceState({}, '', url);
                }}
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="mb-2">
                      {format(new Date(event.start_at), 'MMM d')}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                    {event.title}
                  </h3>
                  
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(event.start_at), 'h:mm a')}
                    </span>
                  </div>

                  {event.location?.name && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.location.name}</span>
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant={isInCalendar ? "secondary" : "default"}
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isInCalendar) {
                      handleRemoveFromCalendar(event.id);
                    } else {
                      handleAddToCalendar(event.id);
                    }
                  }}
                >
                  {isInCalendar ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Calendar
                    </>
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}