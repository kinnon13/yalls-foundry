/**
 * Design Lock PIN System
 * 
 * Prevents accidental layout changes in production
 */

import type { DesignLockState, DesignLockConfig, DesignLockAction } from './types';

const DEFAULT_PIN = '1234';  // Dev only — should be env var in prod
const LOCK_TIMEOUT = 60 * 60 * 1000;  // 1 hour
const STORAGE_KEY = 'yalls:design-lock';

/**
 * Get current lock state from sessionStorage
 */
export function getDesignLockState(): DesignLockState {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { isLocked: true, unlockedUntil: null };
  }
  
  try {
    const state: DesignLockState = JSON.parse(stored);
    
    // Check if unlock expired
    if (state.unlockedUntil && Date.now() > state.unlockedUntil) {
      return { isLocked: true, unlockedUntil: null };
    }
    
    return state;
  } catch {
    return { isLocked: true, unlockedUntil: null };
  }
}

/**
 * Save lock state to sessionStorage
 */
export function setDesignLockState(state: DesignLockState): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Check if design is currently locked
 */
export function isDesignLocked(): boolean {
  const state = getDesignLockState();
  return state.isLocked;
}

/**
 * Verify PIN and unlock if correct
 */
export function unlockDesign(pin: string): boolean {
  const correctPin = import.meta.env.VITE_DESIGN_PIN || DEFAULT_PIN;
  
  if (pin !== correctPin) {
    return false;
  }
  
  const unlockedUntil = Date.now() + LOCK_TIMEOUT;
  setDesignLockState({ isLocked: false, unlockedUntil });
  
  return true;
}

/**
 * Manually lock design
 */
export function lockDesign(): void {
  setDesignLockState({ isLocked: true, unlockedUntil: null });
}

/**
 * Check if action requires PIN
 */
export function requiresPIN(action: DesignLockAction): boolean {
  // For now, all design actions require PIN
  return true;
}

/**
 * Attempt an action — throws if locked
 */
export function attemptAction(action: DesignLockAction): boolean {
  if (!requiresPIN(action)) {
    return true;
  }
  
  const locked = isDesignLocked();
  if (locked) {
    throw new Error(`Design is locked. Enter PIN to ${action}.`);
  }
  
  return true;
}
