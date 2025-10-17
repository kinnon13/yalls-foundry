/**
 * EventCard - Event with date/time chip, location, RSVP
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';
import type { EventFeedItem } from '@/types/feed';
import { format } from 'date-fns';

interface EventCardProps {
  event: EventFeedItem;
}

export function EventCard({ event }: EventCardProps) {
  const startsAt = event.starts_at ? new Date(event.starts_at) : null;

  return (
    <Card className="p-4 space-y-4 shadow-md rounded-xl">
      {/* Date chip */}
      {startsAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(startsAt, 'MMM d, yyyy • h:mm a')}</span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold">{event.title}</h3>

      {/* Location */}
      {event.location && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{JSON.stringify(event.location)}</span>
        </div>
      )}

      {/* RSVP */}
      <Button className="w-full">RSVP</Button>
    </Card>
  );
}
