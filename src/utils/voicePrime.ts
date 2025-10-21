/**
 * Voice priming utilities for instant TTS playback
 * Unlocks audio context and prefetches greeting with role-specific voice
 */

import { supabase } from '@/integrations/supabase/client';
import { VoiceRole, getVoiceProfile } from '@/config/voiceProfiles';

const GREETING_TEXT = "Hi! I'm Rocker. I'll set up your business profile in under a minute. I'll ask for your business name, a unique ID, and your website so I can pull in the details for you. Ready?";

function b64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Unlock audio context and prefetch greeting TTS
 * Call this on user gesture (button click) before navigating to chat
 */
export async function voicePrime(role: VoiceRole = 'user'): Promise<void> {
  const t0 = performance.now();
  const profile = getVoiceProfile(role);
  
  try {
    // 1) Unlock audio context (iOS Safari fix)
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const buf = ctx.createBuffer(1, 22050, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      await ctx.resume();
    }

    // 2) Prefetch greeting TTS with role-specific voice
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: { 
        text: GREETING_TEXT, 
        voice: profile.voice,
        rate: profile.rate,
        pitch: profile.pitch
      }
    });

    if (error) throw error;

    const blob = b64ToBlob(data.audioContent, 'audio/mpeg');
    const url = URL.createObjectURL(blob);
    sessionStorage.setItem(`preTtsUrl_${role}`, url);
    sessionStorage.setItem(`preTtsText_${role}`, GREETING_TEXT);
    sessionStorage.setItem(`preTtsVoice_${role}`, profile.voice);
    
    const t1 = performance.now();
    console.log('[VoicePrime] Preloaded greeting:', { 
      role, 
      voice: profile.voice, 
      rate: profile.rate,
      ms: Math.round(t1 - t0) 
    });
  } catch (error) {
    console.error('[VoicePrime] Failed:', error);
    // Clear any partial data
    sessionStorage.removeItem(`preTtsUrl_${role}`);
    sessionStorage.removeItem(`preTtsText_${role}`);
    sessionStorage.removeItem(`preTtsVoice_${role}`);
  }
}

/**
 * Play preloaded greeting (no fallback)
 * Returns a promise that resolves when audio starts playing
 */
export async function playPreloadedGreeting(
  role: VoiceRole,
  onEnded: () => void,
  onError?: (error: Error) => void
): Promise<{ method: 'preloaded' | 'failed'; ttfa: number }> {
  const t0 = performance.now();
  const preUrl = sessionStorage.getItem(`preTtsUrl_${role}`);
  const preText = sessionStorage.getItem(`preTtsText_${role}`);
  const preVoice = sessionStorage.getItem(`preTtsVoice_${role}`);

  let played = false;
  let method: 'preloaded' | 'failed' = 'preloaded';

  const playPreloaded = async (): Promise<void> => {
    if (!preUrl) return;
    
    const audio = new Audio(preUrl);
    audio.onplaying = () => {
      played = true;
      const t3 = performance.now();
      console.log('[VoicePlayback] TTFA (preloaded):', { 
        role, 
        voice: preVoice, 
        ttfa: Math.round(t3 - t0) 
      });
    };
    
    audio.onended = () => {
      URL.revokeObjectURL(preUrl);
      sessionStorage.removeItem(`preTtsUrl_${role}`);
      sessionStorage.removeItem(`preTtsText_${role}`);
      sessionStorage.removeItem(`preTtsVoice_${role}`);
      onEnded();
    };

    audio.onerror = (err) => {
      const error = new Error('Preloaded audio playback failed');
      console.error('[VoicePlayback] Preloaded audio error:', err);
      URL.revokeObjectURL(preUrl);
      sessionStorage.removeItem(`preTtsUrl_${role}`);
      sessionStorage.removeItem(`preTtsText_${role}`);
      sessionStorage.removeItem(`preTtsVoice_${role}`);
      method = 'failed';
      onError?.(error);
      onEnded();
    };

    try {
      await audio.play();
    } catch (error) {
      const playError = new Error(`Audio play failed: ${error instanceof Error ? error.message : 'unknown'}`);
      console.error('[VoicePlayback] Play error:', playError);
      method = 'failed';
      onError?.(playError);
    }
  };

  // Wait up to 500ms for preloaded audio
  await Promise.race([
    playPreloaded(),
    new Promise<void>(resolve => setTimeout(resolve, 500))
  ]);

  if (!played) {
    const timeoutError = new Error(`TTS audio not ready for ${role} - voice disabled for this session`);
    console.error('[VoicePlayback] Preload timeout:', { role, voice: preVoice });
    method = 'failed';
    onError?.(timeoutError);
    onEnded();
  } else {
    console.log('[VoicePlayback] ✓ Server TTS:', { 
      role, 
      voice: preVoice, 
      ttfa: Math.round(performance.now() - t0) 
    });
  }

  const ttfa = performance.now() - t0;
  return { method, ttfa };
}
