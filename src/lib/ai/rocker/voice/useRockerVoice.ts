/**
 * Rocker Voice Hook
 * 
 * @deprecated Use useVoice({ role }) for role-based voice with server TTS.
 * This hook uses RealtimeVoice with Web Speech fallback.
 * 
 * Production-grade voice state management with mic access and VAD
 */

import { useCallback, useRef, useState } from 'react';
import { RealtimeVoice, VoiceStatus } from './RealtimeVoice';

export function useRockerVoice() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isAlwaysListening, setIsAlwaysListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('disconnected');
  const [voiceTranscript, setVoiceTranscript] = useState('');

  const voiceRef = useRef<RealtimeVoice | null>(null);

  const toggleVoiceMode = useCallback(async () => {
    if (isVoiceMode) {
      voiceRef.current?.disconnect();
      voiceRef.current = null;
      setIsVoiceMode(false);
      setVoiceStatus('disconnected');
      setVoiceTranscript('');
      return;
    }

    const adapter = new RealtimeVoice({
      onStatus: (s) => setVoiceStatus(s),
      onTranscript: (t) => setVoiceTranscript(t),
    });

    await adapter.connect();
    voiceRef.current = adapter;
    setIsVoiceMode(true);
  }, [isVoiceMode]);

  const toggleAlwaysListening = useCallback(async () => {
    setIsAlwaysListening((p) => !p);
  }, []);

  return {
    isVoiceMode,
    isAlwaysListening,
    voiceStatus,
    voiceTranscript,
    toggleVoiceMode,
    toggleAlwaysListening,
  };
}
