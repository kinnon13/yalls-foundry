/**
 * Speech Recognition Hook
 * 
 * Wrapper around Web Speech API for voice capture
 */

import { useCallback, useRef, useState } from 'react';
import '@/types/speech.d.ts';

interface UseSpeechOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeech({ onTranscript, onError }: UseSpeechOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  const start = useCallback(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      onError?.('Speech recognition is not supported in this browser');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          onTranscript(transcript, result.isFinal);
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('[Speech] Recognition error:', event.error);
        setListening(false);
        onError?.(event.error);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    } catch (error) {
      console.error('[Speech] Failed to start recognition:', error);
      onError?.('Failed to start speech recognition');
    }
  }, [onTranscript, onError]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { start, stop, listening, supported };
}
