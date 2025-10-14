/**
 * Feature Flags (localStorage-based)
 * 
 * Provides client-side feature flag management with localStorage persistence.
 * Safe for SSR/CI environments with defensive window checks.
 */

const STORAGE_KEY = 'yalls_feature_flags';

const DEFAULT_FLAGS: Record<string, boolean> = {
  feed: true,
  market: true,
  events: true,
  ai: true,
};

/**
 * Check if localStorage is available (browser environment)
 */
function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Load all flags from localStorage, merging with defaults
 */
function loadFlags(): Record<string, boolean> {
  if (!hasLocalStorage()) return { ...DEFAULT_FLAGS };
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_FLAGS };
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_FLAGS, ...parsed };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

/**
 * Save flags to localStorage
 */
function saveFlags(flags: Record<string, boolean>): void {
  if (!hasLocalStorage()) return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // Silent fail - no storage available
  }
}

/**
 * Get a feature flag value
 */
export function getFlag(key: string, defaultValue = true): boolean {
  const flags = loadFlags();
  return flags[key] !== undefined ? flags[key] : defaultValue;
}

/**
 * Set a feature flag value
 */
export function setFlag(key: string, value: boolean): void {
  const flags = loadFlags();
  flags[key] = value;
  saveFlags(flags);
}

/**
 * List all feature flags
 */
export function listFlags(): Record<string, boolean> {
  return loadFlags();
}

/**
 * Reset flags to defaults
 */
export function resetFlags(): void {
  saveFlags(DEFAULT_FLAGS);
}
