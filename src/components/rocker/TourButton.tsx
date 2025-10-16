/**
 * Tour Button Component
 * 
 * Quick action button to start platform tour with Rocker
 */

import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';
import { useRockerGlobal } from '@/lib/ai/rocker/context';
import { useToast } from '@/hooks/use-toast';

export function TourButton() {
  const { toast } = useToast();

  const startTour = async () => {
    // Tell Rocker to start the tour without requiring context hook
    window.dispatchEvent(new CustomEvent('rocker-start-tour'));
    toast({
      title: 'Tour Started',
      description: 'Rocker will guide you through all features',
    });
  };

  return (
    <Button
      onClick={startTour}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Map className="h-4 w-4" />
      Platform Tour
    </Button>
  );
}
