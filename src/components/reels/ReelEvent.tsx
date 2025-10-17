// ReelEvent - Event feed item with RSVP and links (PR5)
import { EventFeedItem } from '@/types/feed';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ReelEventProps {
  reel: EventFeedItem;
  onRSVP?: () => void;
}

export function ReelEvent({ reel, onRSVP }: ReelEventProps) {
  const formattedDate = reel.starts_at 
    ? new Date(reel.starts_at).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Date TBA';

  const formattedTime = reel.starts_at
    ? new Date(reel.starts_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    : '';

  return (
    <article className="relative h-[80vh] w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-neutral-950 text-white">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6">
        {/* Header badges */}
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-white/10 backdrop-blur-sm">
            <Calendar className="h-3 w-3 mr-1" />
            Event
          </Badge>
        </div>

        {/* Main content */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight">{reel.title}</h2>

          {/* Date/Time/Location */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-white/70" />
              <div>
                <p className="font-medium">{formattedDate}</p>
                {formattedTime && (
                  <p className="text-sm text-white/70">{formattedTime}</p>
                )}
              </div>
            </div>

            {reel.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-white/70" />
                <p className="text-white/90">
                  {typeof reel.location === 'string' 
                    ? reel.location 
                    : reel.location?.name || 'Location TBA'}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full bg-white text-black hover:bg-white/90"
              onClick={onRSVP}
            >
              RSVP Now
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <a href={`/events/${reel.id}/draw`}>
                  View Draw
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
                asChild
              >
                <a href={`/events/${reel.id}/results`}>
                  Results
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
