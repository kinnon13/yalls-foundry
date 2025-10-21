/**
 * Voice profiles for different Rocker personas
 * Each role gets a distinct voice for easy identification
 */

export type VoiceRole = 'user' | 'admin' | 'super';

export interface VoiceProfile {
  engine: 'server_tts';
  voice: string;
  rate: number;
  pitch: number;
  allowFallback: boolean;
  sttEnabled: boolean;
}

export const VOICE_PROFILES: Record<VoiceRole, VoiceProfile> = {
  user: {
    engine: 'server_tts',
    voice: 'onyx',
    rate: 1.35,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
  },
  admin: {
    engine: 'server_tts',
    voice: 'nova',
    rate: 1.20,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
  },
  super: {
    engine: 'server_tts',
    voice: 'alloy',
    rate: 1.25,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
  },
} as const;

export function getVoiceProfile(role: VoiceRole): VoiceProfile {
  return VOICE_PROFILES[role];
}
