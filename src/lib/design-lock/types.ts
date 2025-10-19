/**
 * Design Lock Types
 * 
 * PIN-protected layout editing system
 */

export interface DesignLockState {
  isLocked: boolean;
  unlockedUntil: number | null;  // timestamp
}

export interface DesignLockConfig {
  pin: string;  // Default: '1234' (dev only)
  lockTimeout: number;  // Auto-lock after N minutes (default: 60)
  requirePinFor: DesignLockAction[];
}

export type DesignLockAction =
  | 'resize-panes'
  | 'reorder-apps'
  | 'change-layout'
  | 'edit-favorites'
  | 'move-dock';

export interface DesignLockError {
  code: 'LOCKED' | 'WRONG_PIN' | 'TIMEOUT';
  message: string;
}
