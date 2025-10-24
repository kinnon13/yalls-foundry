/**
 * Voice Hook for Business Onboarding
 * Provides TTS (speak) and STT (listen) with role-based voices
 * No Web Speech fallback - errors surface to UI
 * 
 * Feature flag: When dynamic_personas_enabled = true, profiles can be customized
 * Default: Uses locked STATIC_VOICE_PROFILES (flag is OFF)
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { VoiceRole, getVoiceProfile, getEffectiveVoiceProfile } from '@/config/voiceProfiles';
import { supabase } from '@/integrations/supabase/client';

export interface UseVoiceOptions {
  role: VoiceRole;
  enabled: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
}

export function useVoice({ role, enabled, onTranscript }: UseVoiceOptions) {
  const [profile, setProfile] = useState(() => getVoiceProfile(role));
  const recognitionRef = useRef<any>(null);
  const speakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Load effective profile (checks feature flag)
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: isDynamicEnabled } = await supabase
          .rpc('get_feature_flag', { flag_key: 'dynamic_personas_enabled' });
        
        const effectiveProfile = await getEffectiveVoiceProfile(
          role,
          isDynamicEnabled ?? false
        );
        setProfile(effectiveProfile);
        
        console.log('[Voice] Profile loaded:', { 
          role, 
          voice: effectiveProfile.voice, 
          rate: effectiveProfile.rate,
          dynamic: isDynamicEnabled ?? false
        });
      } catch (error) {
        console.error('[Voice] Failed to load profile, using static:', error);
        setProfile(getVoiceProfile(role));
      }
    };
    
    loadProfile();
  }, [role]);

  // Text-to-Speech with callback - using role-specific voice (no fallback)
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
    console.log('[Voice] TTS start:', { 
      engine: profile.engine, 
      voice: profile.voice, 
      rate: profile.rate,
      role 
    });
    
    try {
      speakingRef.current = true;
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voice: profile.voice,
          rate: profile.rate,
          pitch: profile.pitch
        }
      });

      if (error) {
        const ttsError = new Error(`TTS failed: ${error.message}`);
        console.error('[Voice] TTS API error:', { role, voice: profile.voice, error: error.message });
        
        // Log to voice_events table
        try {
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.user?.id) {
            await supabase.from('voice_events').insert({
              user_id: session.session.user.id,
              actor_role: role,
              kind: 'tts_failure',
              payload: { voice: profile.voice, rate: profile.rate, error: error.message }
            });
          }
        } catch (logError) {
          console.warn('[Voice] Failed to log error:', logError);
        }
        
        onError?.(ttsError);
        throw ttsError;
      }

      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
      audio.onplaying = () => {
        setIsSpeaking(true);
        const t1 = performance.now();
        console.log('[Voice] ✓ TTS playing:', { 
          ttfa: Math.round(t1 - t0), 
          engine: profile.engine, 
          voice: profile.voice, 
          rate: profile.rate,
          role 
        });
      };
      
      audio.onended = () => {
        setIsSpeaking(false);
        speakingRef.current = false;
        then?.();
      };
      
      audio.onerror = async (e) => {
        const playError = new Error('Audio playback failed');
        console.error('[Voice] Audio playback error:', { role, voice: profile.voice, error: e });
        
        // Log playback error
        try {
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.user?.id) {
            await supabase.from('voice_events').insert({
              user_id: session.session.user.id,
              actor_role: role,
              kind: 'audio_playback_error',
              payload: { voice: profile.voice, rate: profile.rate }
            });
          }
        } catch (logError) {
          console.warn('[Voice] Failed to log playback error:', logError);
        }
        
        setIsSpeaking(false);
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
  }, [enabled, profile, role]);

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
    
    if (!enabled || !profile.sttEnabled || !SpeechRecognition) {
      console.warn('[Voice] Speech recognition not available:', { enabled, sttEnabled: profile.sttEnabled });
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
  }, [enabled, profile]);

  return {
    speakAndThen,
    listen,
    stopAll,
    isSupported: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    isSpeaking,
    profile
  };
}
