/**
 * Rocker Voice Hook
 * Production-grade voice state management with mic access and VAD
 */

import { useState, useRef, useCallback } from 'react';
import { VoiceRecorder } from './recorder';
import type { VoiceStatus } from '../types';
import { RealtimeVoice } from '@/utils/RealtimeAudio';

export function useRockerVoice() {
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isAlwaysListening, setIsAlwaysListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('disconnected');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  
  const voiceRef = useRef<RealtimeVoice | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);

  const toggleVoiceMode = useCallback(async () => {
    if (isVoiceMode) {
      // Stop voice mode
      voiceRef.current?.disconnect();
      recorderRef.current?.stop();
      setIsVoiceMode(false);
      setVoiceStatus('disconnected');
      setVoiceTranscript('');
    } else {
      // Start voice mode
      try {
        setVoiceStatus('connecting');
        
        // Request mic permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Initialize voice connection
        voiceRef.current = new RealtimeVoice(
          (status) => setVoiceStatus(status),
          (text) => setVoiceTranscript(text)
        );
        
        await voiceRef.current.connect('');
        setIsVoiceMode(true);
        setVoiceStatus('connected');
      } catch (error) {
        console.error('[Rocker Voice] Failed to start:', error);
        setVoiceStatus('disconnected');
        throw error;
      }
    }
  }, [isVoiceMode]);

  const toggleAlwaysListening = useCallback(async () => {
    setIsAlwaysListening(prev => !prev);
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
