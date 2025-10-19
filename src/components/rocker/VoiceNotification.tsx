import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Volume2, X } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceNotificationProps {
  onDismiss?: () => void;
}

export function VoiceNotification({ onDismiss }: VoiceNotificationProps) {
  const [notification, setNotification] = useState<any>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel('voice-interactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_interactions',
        },
        (payload) => {
          const newInteraction = payload.new;
          
          if (newInteraction.interaction_type === 'voice_message' && newInteraction.recording_url) {
            setNotification(newInteraction);
            toast.info('🎙️ Rocker sent you a voice message', {
              duration: 10000,
            });
          } else if (newInteraction.interaction_type === 'call') {
            toast.info('📞 Rocker is calling you', {
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      audio?.pause();
    };
  }, [audio]);

  const playVoiceMessage = () => {
    if (notification?.recording_url) {
      const newAudio = new Audio(notification.recording_url);
      newAudio.play();
      setAudio(newAudio);
      
      newAudio.onended = () => {
        setAudio(null);
      };
    }
  };

  const handleDismiss = () => {
    audio?.pause();
    setNotification(null);
    onDismiss?.();
  };

  if (!notification || notification.interaction_type !== 'voice_message') {
    return null;
  }

  return (
    <Card className="fixed bottom-24 right-4 w-80 shadow-lg border-primary/20 bg-background/95 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Voice Message from Rocker</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          {notification.transcript || 'Click play to listen'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={playVoiceMessage}
          className="w-full"
          variant="default"
        >
          <Phone className="h-4 w-4 mr-2" />
          Play Message
        </Button>
      </CardContent>
    </Card>
  );
}
