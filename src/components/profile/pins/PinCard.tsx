import { ProfilePin } from '@/ports/profilePins';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Award, Calendar, DollarSign, Link as LinkIcon, Trophy } from 'lucide-react';

interface PinCardProps {
  pin: ProfilePin;
  onRemove?: () => void;
}

const iconMap = {
  post: LinkIcon,
  event: Calendar,
  horse: Award,
  earning: DollarSign,
  link: LinkIcon,
  achievement: Trophy,
};

export function PinCard({ pin, onRemove }: PinCardProps) {
  const Icon = iconMap[pin.pin_type] || Award;

  return (
    <Card className="relative group h-32 hover:shadow-lg transition-shadow">
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onClick={onRemove}
          aria-label={`Remove ${pin.title || pin.ref_id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <CardContent className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Icon className="h-8 w-8 text-primary mb-2" aria-hidden="true" />
        <p className="text-sm font-medium line-clamp-2">
          {pin.title || `${pin.pin_type}: ${pin.ref_id.slice(0, 8)}`}
        </p>
        <span className="text-xs text-muted-foreground mt-1 capitalize">{pin.pin_type}</span>
      </CardContent>
    </Card>
  );
}
