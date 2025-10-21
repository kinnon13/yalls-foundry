import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { speak } from '@/utils/voice';

interface UseAndyVoiceOptions {
  threadId: string | null;
  enabled?: boolean;
}

export function useAndyVoice({ threadId, enabled = true }: UseAndyVoiceOptions) {
  const { session } = useSession();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [silenceMs, setSilenceMs] = useState(2500);
  const silenceTimerRef = useRef<any>(null);

  // Load preferences
  useEffect(() => {
    const loadPrefs = async () => {
      if (!session?.userId) return;
      
      const { data } = await supabase
        .from('ai_preferences')
        .select('voice_enabled, silence_ms')
        .eq('user_id', session.userId)
        .maybeSingle();
      
      if (data) {
        setVoiceEnabled(data.voice_enabled ?? true);
        setSilenceMs(data.silence_ms ?? 2500);
      }
    };
    
    loadPrefs();
  }, [session?.userId]);

  // Handle silence-based auto-questioning
  const onUserActivity = () => {
    if (!enabled || !threadId) return;
    
    clearTimeout(silenceTimerRef.current);
    
    silenceTimerRef.current = setTimeout(async () => {
      console.log('⏰ Silence detected, asking Andy for a question...');
      
      try {
        const { data } = await supabase.functions.invoke('andy-live-question', {
          body: { thread_id: threadId }
        });
        
        console.log('Andy question result:', data);
      } catch (error) {
        console.error('Failed to trigger Andy question:', error);
      }
    }, silenceMs);
  };

  // Speak assistant messages
  const speakMessage = (text: string) => {
    if (!voiceEnabled || !enabled) return;
    
    // Clean up text for speaking
    const cleanText = text
      .replace(/\n+/g, ' ')
      .replace(/[*_~`]/g, '')
      .replace(/https?:\/\/[^\s]+/g, 'link')
      .trim();
    
    if (cleanText) {
      speak(cleanText);
    }
  };

  // Auto-learn from messages (with deep analysis hardwired)
  const learnFromMessage = async (messageId: number, content: string) => {
    if (!enabled || !threadId) return;
    
    try {
      // This now automatically triggers deep analysis inside the function
      const { data } = await supabase.functions.invoke('andy-learn-from-message', {
        body: {
          thread_id: threadId,
          message_id: messageId,
          content
        }
      });
      
      console.log('Andy learning + deep analysis result:', data);
      
      // Every 10 messages, expand the entire memory system
      if (messageId % 10 === 0 && session?.userId) {
        console.log('🧠 Triggering memory expansion...');
        supabase.functions.invoke('andy-expand-memory', {
          body: { user_id: session.userId }
        }).catch(e => console.warn('Memory expansion failed:', e));
      }
    } catch (error) {
      console.error('Failed to learn from message:', error);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return {
    voiceEnabled,
    onUserActivity,
    speakMessage,
    learnFromMessage
  };
}
