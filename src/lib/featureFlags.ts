/**
 * Feature Flags (Track D)
 * Server-first flags with client-side override for dev
 */

const FLAGS = {
  feed_shop_blend: true,
  discover_reels: true,
  payments_real: false,
  rocker_always_on: true,
} as const;

export type FeatureFlag = keyof typeof FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Check client override (dev only)
  const override = sessionStorage.getItem(`flag:${flag}`);
  if (override !== null) {
    return override === 'true';
  }
  
  // Default to hardcoded values
  return FLAGS[flag];
}

export function setFeatureOverride(flag: FeatureFlag, enabled: boolean) {
  sessionStorage.setItem(`flag:${flag}`, String(enabled));
}

export function clearFeatureOverride(flag: FeatureFlag) {
  sessionStorage.removeItem(`flag:${flag}`);
}

export function getAllFlags(): Record<FeatureFlag, boolean> {
  return Object.keys(FLAGS).reduce((acc, key) => {
    acc[key as FeatureFlag] = isFeatureEnabled(key as FeatureFlag);
    return acc;
  }, {} as Record<FeatureFlag, boolean>);
}
