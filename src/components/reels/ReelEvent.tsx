/**
 * Reel Event Card
 * Date/time/venue chips, RSVP, Draw/Results
 */

import { useState } from 'react';
import { Calendar, MapPin, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsageEvent } from '@/hooks/useUsageEvent';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ReelEventProps {
  data: {
    host_entity_id: string;
    title: string;
    description: string;
    starts_at: string;
    ends_at: string;
    location?: any;
    media?: any[];
  };
  itemId: string;
}

export function ReelEvent({ data, itemId }: ReelEventProps) {
  const [rsvpd, setRsvpd] = useState(false);
  const logUsageEvent = useUsageEvent();
  const { toast } = useToast();

  const hasMedia = data.media && data.media.length > 0;
  const startsAt = new Date(data.starts_at);
  const endsAt = new Date(data.ends_at);

  const handleRSVP = async () => {
    setRsvpd(!rsvpd);
    logUsageEvent('rsvp', 'event', itemId, { action: rsvpd ? 'cancel' : 'confirm' });
    toast({ 
      title: rsvpd ? 'RSVP cancelled' : 'RSVP confirmed!',
      description: rsvpd ? undefined : 'We\'ll send you a reminder before the event.' 
    });
  };

  const handleDraw = () => {
    logUsageEvent('click', 'event', itemId, { action: 'draw' });
    toast({ title: 'Draw feature coming soon!' });
  };

  const handleResults = () => {
    logUsageEvent('click', 'event', itemId, { action: 'results' });
    toast({ title: 'Results feature coming soon!' });
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-card rounded-lg overflow-hidden shadow-lg animate-scale-in">
      {/* Cover Image */}
      {hasMedia && (
        <div className="relative w-full aspect-[16/9] bg-muted">
          <img
            src={data.media[0].url}
            alt={data.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">{data.title}</h2>

        {/* Date/Time/Location Chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm">
            <Calendar size={14} />
            <span>{format(startsAt, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm">
            <Calendar size={14} />
            <span>{format(startsAt, 'h:mm a')}</span>
          </div>
          {data.location && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-sm">
              <MapPin size={14} />
              <span className="truncate max-w-[200px]">
                {data.location.venue || data.location.city || 'Location TBA'}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6 line-clamp-4">{data.description}</p>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <Button
            className={`flex-1 ${rsvpd ? 'bg-primary/20 text-primary' : ''}`}
            variant={rsvpd ? 'outline' : 'default'}
            onClick={handleRSVP}
          >
            <Users size={18} className="mr-2" />
            {rsvpd ? 'RSVP\'d' : 'RSVP'}
          </Button>
          <Button variant="outline" onClick={handleDraw}>
            Draw
          </Button>
          <Button variant="outline" onClick={handleResults}>
            <Award size={18} className="mr-1" />
            Results
          </Button>
        </div>

        {/* Attendees Count (Mock) */}
        <p className="text-xs text-muted-foreground text-center">
          42 people attending
        </p>
      </div>
    </div>
  );
}
