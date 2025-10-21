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
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Text-to-Speech
  const speak = useCallback((text: string) => {
    if (!enabled || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.02; // Slightly higher for "Rocker" personality
    utterance.volume = 1.0;
    utterance.lang = 'en-US';
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [enabled]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
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
    isSupported: 'speechSynthesis' in window && 
                 ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  };
}
