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
  const speakingRef = useRef(false);

  // Text-to-Speech with callback - using OpenAI TTS (onyx, 1.35x, no fallback)
  const speakAndThen = useCallback(async (
    text: string, 
    then?: () => void,
    onError?: (error: Error) => void
  ) => {
    if (!enabled) {
      then?.();
      return;
    }
    
    const t0 = performance.now();
    console.log('[Voice] TTS start:', { engine: 'server_tts', voice: 'onyx', speed: 1.35 });
    
    try {
      speakingRef.current = true;
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'onyx' }
      });

      if (error) {
        const ttsError = new Error(`TTS failed: ${error.message}`);
        console.error('[Voice] TTS API error:', error);
        onError?.(ttsError);
        throw ttsError;
      }

      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
      audio.onplaying = () => {
        const t1 = performance.now();
        console.log('[Voice] ✓ TTS playing:', { ttfa: Math.round(t1 - t0), engine: 'server_tts', voice: 'onyx', speed: '1.35x' });
      };
      
      audio.onended = () => {
        speakingRef.current = false;
        then?.();
      };
      
      audio.onerror = (e) => {
        const playError = new Error('Audio playback failed');
        console.error('[Voice] Audio playback error:', e);
        speakingRef.current = false;
        onError?.(playError);
        then?.();
      };
      
      await audio.play();
    } catch (error) {
      console.error('[Voice] TTS error:', error);
      speakingRef.current = false;
      const finalError = error instanceof Error ? error : new Error('Unknown TTS error');
      onError?.(finalError);
      then?.();
    }
  }, [enabled]);

  // Stop all voice activity
  const stopAll = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    speakingRef.current = false;
  }, []);

  // Speech-to-Text with auto-restart
  const listen = useCallback((onFinal: (text: string) => void, onInterim?: (text: string) => void) => {
    const SpeechRecognition = 
      (window as any).webkitSpeechRecognition || 
      (window as any).SpeechRecognition;
    
    if (!enabled || !SpeechRecognition) {
      console.warn('[Voice] Speech recognition not supported');
      return () => {};
    }

    // Stop existing recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    const recognition: any = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results) as any[];
      const transcript = results.map(r => r[0].transcript).join(' ').trim();
      const isFinal = results[results.length - 1]?.isFinal;
      
      if (isFinal) {
        onFinal(transcript);
      } else {
        onInterim?.(transcript);
      }
    };

    // Auto-restart on end if still visible
    const restart = () => {
      setTimeout(() => {
        if (document.visibilityState === 'visible' && recognitionRef.current === recognition) {
          try {
            recognition.start();
          } catch {}
        }
      }, 500);
    };

    recognition.onend = restart;
    recognition.onerror = (event: any) => {
      // Suppress benign errors (no-speech is expected when user is silent)
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('[Voice] Recognition error:', event.error);
      }
      if (event.error !== 'aborted') {
        restart();
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('[Voice] Failed to start recognition:', error);
    }

    return () => {
      if (recognitionRef.current === recognition) {
        try {
          recognition.stop();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, [enabled]);

  return {
    speakAndThen,
    listen,
    stopAll,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  };
}
