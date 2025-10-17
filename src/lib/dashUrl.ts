/**
 * Dashboard URL Helpers
 * 
 * All dashboard navigation uses query params on /dashboard
 */

export const MODULES = [
  'overview',
  'business',
  'producers',
  'incentives',
  'stallions',
  'farm_ops',
  'events',
  'orders',
  'earnings',
  'messages',
  'approvals',
  'settings'
] as const;

export type ModuleKey = typeof MODULES[number];

export function coerceModule(v: string | null): ModuleKey {
  return (MODULES as readonly string[]).includes(v ?? '') ? (v as ModuleKey) : 'overview';
}

export function buildDashUrl(params: Record<string, string | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined) sp.set(k, v);
  }
  return `/dashboard?${sp.toString()}`;
}

export function updateDashParams(
  currentParams: URLSearchParams,
  updates: Record<string, string | null>
): URLSearchParams {
  const next = new URLSearchParams(currentParams);
  for (const [k, v] of Object.entries(updates)) {
    if (v === null) next.delete(k);
    else next.set(k, v);
  }
  return next;
}
