/**
 * EventCard - Event card with date/time, location, and RSVP
 */

import { EventFeedItem } from '@/types/feed';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { logClick } from '@/lib/telemetry/usage';

interface EventCardProps {
  event: EventFeedItem;
}

export function EventCard({ event }: EventCardProps) {
  const handleRSVP = () => {
    logClick('feed_event', 'event', event.id);
    console.log('[EventCard] RSVP:', event.id);
  };

  const handleViewDetails = () => {
    logClick('feed_event', 'event', event.id);
    window.location.href = `/events/${event.id}`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card">
      <CardContent className="p-6 space-y-4">
        {/* Date/Time Chip */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {event.starts_at ? format(new Date(event.starts_at), 'PPP p') : 'Date TBA'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground">
          {event.title}
        </h3>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{JSON.stringify(event.location)}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleRSVP}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            RSVP
          </Button>
          <Button
            onClick={handleViewDetails}
            variant="outline"
            size="sm"
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
