/**
 * Pin Feature Flags
 * Single source of truth for auto-pin behavior
 */

export const PIN_FEATURES = {
  /** Enable auto-pinning on follow */
  PIN_ON_FOLLOW: true,
  
  /** Number of days to lock auto-pinned items */
  PIN_LOCK_DAYS: 14,
  
  /** Minimum interactions before early unlock */
  PIN_MIN_INTERACTIONS: 3,
  
  /** Allow support to force unlock (admin only) */
  PIN_ALLOW_FORCE_UNLOCK: false,
  
  /** Maximum number of pins per user */
  PIN_MAX: 24,
} as const;

export type PinOrigin = 'manual' | 'auto_follow';

export interface LockedPinInfo {
  origin: PinOrigin;
  lockedUntil: Date | null;
  lockReason: string | null;
  useCount: number;
}
