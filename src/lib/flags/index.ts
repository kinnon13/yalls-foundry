/**
 * Unified Feature Flags
 * 
 * Single source of truth for feature toggles.
 * Environment defaults with localStorage overrides.
 * 
 * Usage:
 *   import { getFlag, setFlag, allFlags } from '@/lib/flags';
 *   if (getFlag('feedback')) { <FeedbackWidget /> }
 */

export type FlagKey =
  | 'feedback'   // widget visibility
  | 'ai'         // rocker AI
  | 'events'     // events UI
  | 'market'     // marketplace
  | 'new_search' // experimental search
  | 'feed'       // feed UI
  | 'composer_coach' // live writing coach
  | 'ai_rank'    // AI-powered search ranking and feed curation
  ;

type Store = Partial<Record<FlagKey, boolean>>;
const LS_KEY = 'yalls_flags';

// Env defaults (string 'on'/'off' → boolean)
const ENV_DEFAULTS: Store = {
  feedback: (import.meta.env.VITE_FEEDBACK_WIDGET ?? 'on') === 'on',
  ai:       (import.meta.env.VITE_FEATURE_AI ?? 'on') === 'on',
  events:   (import.meta.env.VITE_FEATURE_EVENTS ?? 'on') === 'on',
  market:   (import.meta.env.VITE_FEATURE_MARKET ?? 'on') === 'on',
  new_search:(import.meta.env.VITE_FEATURE_NEW_SEARCH ?? 'off') === 'on',
  feed:     (import.meta.env.VITE_FEATURE_FEED ?? 'on') === 'on',
  composer_coach: (import.meta.env.VITE_FEATURE_COMPOSER_COACH ?? 'on') === 'on',
  ai_rank:  (import.meta.env.VITE_FEATURE_AI_RANK ?? 'off') === 'on',
};

function load(): Store {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Store; }
  catch { return {}; }
}

function save(s: Store) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent('flags:update', { detail: s }));
}

export function getFlag(key: FlagKey): boolean {
  const overrides = load();
  return (key in overrides) ? !!overrides[key] : !!ENV_DEFAULTS[key];
}

export function setFlag(key: FlagKey, value: boolean): void {
  const overrides = load();
  overrides[key] = value;
  save(overrides);
}

export function allFlags(): Record<string, boolean> {
  const o = load();
  const result: Record<string, boolean> = {};
  
  const allKeys: FlagKey[] = ['feedback', 'ai', 'events', 'market', 'new_search', 'feed', 'composer_coach', 'ai_rank'];
  allKeys.forEach(key => {
    result[key] = getFlag(key);
  });
  
  return result;
}

export function subscribe(cb: (s: Store) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => cb((e as CustomEvent).detail as Store);
  window.addEventListener('flags:update', handler as EventListener);
  return () => window.removeEventListener('flags:update', handler as EventListener);
}

// Legacy aliases for backwards compatibility
export const listFlags = allFlags;
