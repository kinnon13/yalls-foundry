// ReelEvent - Event feed item with RSVP and links (PR5)
import { EventFeedItem } from '@/types/feed';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { logUsageEvent } from '@/lib/telemetry/usageEvents';

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

  const handleRSVP = () => {
    logUsageEvent({
      eventType: 'rsvp',
      itemType: 'event',
      itemId: reel.id,
      payload: { starts_at: reel.starts_at }
    });
    onRSVP?.();
  };

  return (
    <article className="relative h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-gradient-to-br from-primary/30 via-accent/20 to-card shadow-lg animate-scale-in">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6 animate-fade-in">
        {/* Header badges */}
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-primary/20 backdrop-blur-md border border-primary/30 text-primary-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            Event
          </Badge>
        </div>

        {/* Main content */}
        <div className="space-y-6 animate-slide-up">
          <h2 className="text-3xl font-bold leading-tight text-foreground">{reel.title}</h2>

          {/* Date/Time/Location */}
          <div className="space-y-3 text-foreground">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm transition-all duration-200 hover:bg-background/70">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{formattedDate}</p>
                {formattedTime && (
                  <p className="text-sm text-muted-foreground">{formattedTime}</p>
                )}
              </div>
            </div>

            {reel.location && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm transition-all duration-200 hover:bg-background/70">
                <MapPin className="h-5 w-5 text-primary" />
                <p className="text-foreground">
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
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={handleRSVP}
            >
              RSVP Now
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-105"
                asChild
              >
                <a href={`/events/${reel.id}/draw`}>
                  View Draw
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-primary/30 hover:bg-primary/10 transition-all duration-200 hover:scale-105"
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
