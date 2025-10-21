// Voice utilities for Super Andy real-time features

export function speak(text: string, rate = 1.0, pitch = 1.0) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1.0;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// Speech recognition setup
export function startSTT(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (error: any) => void
): (() => void) | null {
  // @ts-ignore - webkit prefix
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    console.warn('Speech recognition not supported');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      const isFinal = result.isFinal;
      onResult(transcript, isFinal);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    if (onError) onError(event);
  };

  recognition.onend = () => {
    console.log('Speech recognition ended');
  };

  try {
    recognition.start();
    console.log('🎤 Speech recognition started');
  } catch (error) {
    console.error('Failed to start speech recognition:', error);
    return null;
  }

  // Return stop function
  return () => {
    try {
      recognition.stop();
      console.log('🔇 Speech recognition stopped');
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  };
}

// Check if voice features are available
export function isVoiceSupported() {
  return {
    tts: 'speechSynthesis' in window,
    // @ts-ignore
    stt: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  };
}
