import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useRockerNotifications = (userId: string | undefined) => {
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    console.log('[Rocker Notifications] Setting up listener for user:', userId);

    // Subscribe to rocker_notifications table
    channelRef.current = supabase
      .channel('rocker-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rocker_notifications',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('[Rocker Notifications] Received:', payload);
          const notification = payload.new;
          const notifPayload = notification.payload || {};
          const metadata = notifPayload.metadata || {};

          // Check if this should trigger TTS (skip if voice session is active)
          const voiceActive = (window as any).__rockerVoiceActive === true || localStorage.getItem('rocker-voice-active') === 'true';
          if (metadata.should_speak && notifPayload.tts_message && !voiceActive) {
            console.log('[Rocker Notifications] Playing TTS:', notifPayload.tts_message);
            try {
              const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
                body: { 
                  text: notifPayload.tts_message,
                  voice: 'alloy'
                }
              });

              if (ttsError) throw ttsError;

              if (ttsData?.audioContent) {
                const audio = new Audio(`data:audio/mp3;base64,${ttsData.audioContent}`);
                await audio.play().catch(err => {
                  console.error('[Rocker Notifications] Audio playback failed:', err);
                  // Fallback to toast if audio fails
                  toast(notifPayload.title || notifPayload.tts_message);
                });
              }
            } catch (error) {
              console.error('[Rocker Notifications] TTS error:', error);
              // Fallback to toast
              toast(notifPayload.title || notifPayload.message);
            }
          } else {
            // Regular notification without TTS
            toast(notifPayload.title || notifPayload.message);
          }

          // Mark as read
          await supabase
            .from('rocker_notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', notification.id);
        }
      )
      .subscribe();

    return () => {
      console.log('[Rocker Notifications] Cleaning up listener');
      channelRef.current?.unsubscribe();
    };
  }, [userId]);
};
