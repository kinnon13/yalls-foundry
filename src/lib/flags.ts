export type FeatureFlag =
  | 'feed_shop_blend'
  | 'discover_reels'
  | 'payments_real'
  | 'rocker_always_on';

const defaults: Record<FeatureFlag, boolean> = {
  feed_shop_blend: true,
  discover_reels: true,
  payments_real: false,
  rocker_always_on: true,
};

export function isEnabled(flag: FeatureFlag): boolean {
  if (typeof sessionStorage === 'undefined') return defaults[flag];
  const v = sessionStorage.getItem(`flag:${flag}`);
  return v === null ? defaults[flag] : v === 'true';
}

export function setFlag(flag: FeatureFlag, on: boolean): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(`flag:${flag}`, String(on));
}

export function getAllFlags(): Record<FeatureFlag, boolean> {
  return {
    feed_shop_blend: isEnabled('feed_shop_blend'),
    discover_reels: isEnabled('discover_reels'),
    payments_real: isEnabled('payments_real'),
    rocker_always_on: isEnabled('rocker_always_on'),
  };
}
