/**
 * Voice profiles for different Rocker personas
 * 
 * STATIC profiles are used by default (feature flag OFF)
 * Dynamic overrides can be enabled later via feature flag (Super Andy only)
 */

export type VoiceRole = 'user_rocker' | 'admin_rocker' | 'super_andy';

export interface VoiceProfile {
  engine: 'server_tts';
  voice: string;
  rate: number;
  pitch: number;
  allowFallback: boolean;
  sttEnabled: boolean;
  displayName: string;
}

/**
 * LOCKED DEFAULT PROFILES
 * These are used when dynamic_personas_enabled = false (default)
 * Single source of truth for voice identity & persona names
 */
export const STATIC_VOICE_PROFILES: Record<VoiceRole, VoiceProfile> = {
  user_rocker: {
    engine: 'server_tts',
    voice: 'onyx',
    rate: 1.35,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
    displayName: 'User Rocker',
  },
  admin_rocker: {
    engine: 'server_tts',
    voice: 'nova',
    rate: 1.20,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
    displayName: 'Admin Rocker',
  },
  super_andy: {
    engine: 'server_tts',
    voice: 'alloy',
    rate: 1.25,
    pitch: 1.02,
    allowFallback: false,
    sttEnabled: true,
    displayName: 'Super Andy',
  },
} as const;

/**
 * Get voice profile for a role
 * When dynamic_personas_enabled = true, this could be extended to merge DB overrides
 * For now, always returns static profile (flag is OFF by default)
 */
export function getVoiceProfile(role: VoiceRole): VoiceProfile {
  return STATIC_VOICE_PROFILES[role];
}

/**
 * Get effective voice profile with dynamic overrides (when feature flag is ON)
 * For now, this just returns static profiles since flag is OFF by default
 * Future: merge user → org → global overrides from DB
 */
export async function getEffectiveVoiceProfile(
  role: VoiceRole,
  isDynamicEnabled: boolean = false,
  _orgId?: string,
  _userId?: string
): Promise<VoiceProfile> {
  const base = STATIC_VOICE_PROFILES[role];
  
  if (!isDynamicEnabled) {
    return base;
  }
  
  // TODO: When flag is ON, merge DB overrides here
  // const dynamicOverrides = await fetchPersonaOverrides(role, orgId, userId);
  // return { ...base, ...dynamicOverrides };
  
  return base;
}
