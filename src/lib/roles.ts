/**
 * Role Normalization & Type Definitions
 * Single source of truth for persona role mapping
 */

import { VoiceRole } from '@/config/voiceProfiles';
import { AIRole } from '@/lib/ai/rocker/config';

export type CanonicalRole = 'user_rocker' | 'admin_rocker' | 'super_andy';

/**
 * Normalize any legacy or variant role string to canonical persona role
 */
export function normalizeActorRole(input?: string): CanonicalRole {
  switch ((input || '').toLowerCase()) {
    case 'admin':
    case 'admin_rocker':
      return 'admin_rocker';
    case 'super':
    case 'super_rocker':
    case 'knower':
    case 'super_andy':
      return 'super_andy';
    case 'user':
    case 'user_rocker':
    default:
      return 'user_rocker';
  }
}

/**
 * Map AI role (UI config) to voice role (TTS config)
 */
export function aiRoleToVoiceRole(aiRole?: AIRole): VoiceRole {
  switch (aiRole) {
    case 'admin':
      return 'admin_rocker';
    case 'knower':
      return 'super_andy';
    case 'user':
    default:
      return 'user_rocker';
  }
}

/**
 * Persona display names (single source of truth)
 */
export const PERSONA_DISPLAY_NAMES: Record<CanonicalRole, string> = {
  user_rocker: 'User Rocker',
  admin_rocker: 'Admin Rocker',
  super_andy: 'Super Andy',
} as const;
