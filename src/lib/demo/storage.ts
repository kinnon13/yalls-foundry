/**
 * Demo Mode Local Storage
 * Persist demo actions (cart, messages, pins) in localStorage
 */

const NS = 'demo:v1';

export const demoKeys = {
  cart: `${NS}:cart`,
  orders: `${NS}:orders`,
  messages: `${NS}:messages`,
  pins: `${NS}:pins`,
  notifications: `${NS}:notifications`,
} as const;

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[Demo] localStorage write failed:', e);
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('[Demo] localStorage remove failed:', e);
  }
}

/**
 * Reset all demo data to initial fixtures
 */
export function resetDemoData(): void {
  Object.values(demoKeys).forEach(remove);
  console.log('[Demo] All demo data reset');
}
