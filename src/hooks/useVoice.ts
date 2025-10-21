/**
 * Voice Hook for Business Onboarding
 * Provides TTS (speak) and STT (listen) using Web Speech API
 */

import { useCallback, useRef } from 'react';

export interface UseVoiceOptions {
  enabled: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
}

export function useVoice({ enabled, onTranscript }: UseVoiceOptions) {
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<HTMLAudioElement | null>(null);

  // Text-to-Speech using OpenAI
  const speak = useCallback(async (text: string) => {
    if (!enabled) return;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'onyx' } // Using 'onyx' for a deeper, more natural voice
      });

      if (error) throw error;

      // Play the audio
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      synthRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error('[Voice] TTS error:', error);
    }
  }, [enabled]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current instanceof HTMLAudioElement) {
      synthRef.current.pause();
      synthRef.current.currentTime = 0;
    }
  }, []);

  // Speech-to-Text
  const listen = useCallback(() => {
    const SpeechRecognition = 
      (window as any).webkitSpeechRecognition || 
      (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('[Voice] Speech recognition not supported');
      return { stop: () => {} };
    }

    const recognition: any = new SpeechRecognition();
    recognition.continuous = false; // One phrase at a time
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results) as any[];
      const transcript = results.map(r => r[0].transcript).join(' ');
      const isFinal = event.results[event.results.length - 1].isFinal;
      
      if (onTranscript) {
        onTranscript(transcript.trim(), isFinal);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice] Recognition error:', event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;

    return {
      stop: () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
      }
    };
  }, [onTranscript]);

  return {
    speak,
    stopSpeaking,
    listen,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
}
