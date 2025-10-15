/**
 * Events List Page
 * 
 * Browse upcoming equine events with type filters.
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getAllEvents } from '@/lib/events/service.supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOHelmet } from '@/lib/seo/helmet';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Plus, Calendar, MapPin } from 'lucide-react';
import type { EventType } from '@/entities/event';

const eventTypes: { value: EventType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'show', label: 'Shows' },
  { value: 'clinic', label: 'Clinics' },
  { value: 'sale', label: 'Sales' },
  { value: 'expo', label: 'Expos' },
  { value: 'conference', label: 'Conferences' },
];

export default function EventsIndex() {
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', typeFilter],
    queryFn: () =>
      getAllEvents({
        type: typeFilter === 'all' ? undefined : typeFilter,
        upcoming: true,
        limit: 50,
      }),
  });

  return (
    <>
      <SEOHelmet
        title="Events"
        description="Browse upcoming equine events, shows, clinics, sales, and conferences"
      />
      <GlobalHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Events</h1>
            <p className="text-muted-foreground mt-2">
              Discover shows, clinics, sales, and more
            </p>
          </div>
          <Link to="/events/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        </div>

        <div className="mb-6">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as EventType | 'all')}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <span className="text-xs uppercase font-semibold text-primary">
                        {event.type}
                      </span>
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(event.starts_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {event.ends_at &&
                        ` - ${new Date(event.ends_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {event.location.name || `${event.location.lat}, ${event.location.lng}`}
                      </div>
                    )}
                    {event.metadata?.venue && (
                      <p className="text-sm mt-2">📍 {event.metadata.venue}</p>
                    )}
                    {event.metadata?.prize_money_cents && (
                      <p className="text-sm mt-1 font-semibold text-primary">
                        💰 ${(event.metadata.prize_money_cents / 100).toLocaleString()} in prizes
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground mb-4">
                {typeFilter === 'all'
                  ? 'Be the first to create an event!'
                  : `No ${typeFilter}s scheduled yet.`}
              </p>
              <Link to="/events/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
