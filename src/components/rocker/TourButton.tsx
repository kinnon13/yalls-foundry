/**
 * Tour Button Component
 * 
 * Quick action button to start platform tour with Rocker
 */

import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function TourButton() {
  const { toast } = useToast();

  const startTour = async () => {
    const rockerButton = document.querySelector('[data-rocker="rocker chat assistant"]') as HTMLButtonElement;
    if (rockerButton) {
      rockerButton.click();
      setTimeout(() => {
        const composer = document.querySelector('[data-rocker="message composer"]') as HTMLTextAreaElement;
        if (composer) {
          composer.value = 'Show me around the platform - give me a complete tour!';
          composer.dispatchEvent(new Event('input', { bubbles: true }));
          setTimeout(() => {
            const sendBtn = document.querySelector('[data-rocker="send message"]') as HTMLButtonElement;
            if (sendBtn) sendBtn.click();
          }, 200);
        }
      }, 300);
    }
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
