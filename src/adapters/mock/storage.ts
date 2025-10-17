/**
 * Namespaced LocalStorage Utilities
 * Versioned keys prevent collisions between app versions
 */

const NS = 'yalls:v1';
const MAX_ITEMS = 200;

export const k = (...parts: string[]) => [NS, ...parts].join(':');

export const read = <T>(key: string, def: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return def;
    return JSON.parse(raw) as T;
  } catch {
    return def;
  }
};

export const write = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('LocalStorage write failed:', e);
  }
};

export const capArray = <T>(arr: T[], max = MAX_ITEMS): T[] => {
  return arr.slice(0, max);
};
