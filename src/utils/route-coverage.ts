/**
 * Route Coverage Classification
 * Determines which undocumented routes are already claimed vs truly new
 */

import { normRoute } from '@/lib/feature-scan-filters';

/**
 * Extract the head segment of a route (e.g., "/events/123" -> "/events")
 */
function headOf(p: string): string {
  const parts = normRoute(p).split('/').filter(Boolean);
  return '/' + (parts[0] ?? '');
}

/**
 * Check if route A covers route B
 * Handles families (/head/*), params (:id), and exact matches
 */
export function routeCovers(a: string, b: string): boolean {
  const A = normRoute(a);
  const B = normRoute(b);

  // Family wildcard: "/head/*"
  if (/^\/[^/]+\/\*$/.test(A)) {
    const head = A.slice(0, A.indexOf('/*'));
    return B === head || B.startsWith(head + '/');
  }
  if (/^\/[^/]+\/\*$/.test(B)) {
    const head = B.slice(0, B.indexOf('/*'));
    return A === head || A.startsWith(head + '/');
  }

  const as = A.split('/').filter(Boolean);
  const bs = B.split('/').filter(Boolean);
  if (as.length !== bs.length) return false;

  for (let i = 0; i < as.length; i++) {
    if (as[i] === ':id' || bs[i] === ':id') continue;
    if (as[i] !== bs[i]) return false;
  }
  return true;
}

/**
 * Classify undocumented routes against claimed routes
 * Uses head indexing for O(n) performance
 */
export function classifyUndocRoutes(
  undocumented: string[],
  claimed: string[]
): { alreadyClaimed: string[]; partiallyClaimed: string[]; trulyNew: string[] } {
  const claimedNorm = [...new Set(claimed.map(normRoute))];
  const claimedByHead = new Map<string, string[]>();
  
  for (const c of claimedNorm) {
    const h = headOf(c);
    const list = claimedByHead.get(h) ?? [];
    if (list.length === 0) claimedByHead.set(h, list);
    list.push(c);
  }

  const alreadyClaimed: string[] = [];
  const partiallyClaimed: string[] = [];
  const trulyNew: string[] = [];

  for (const u of new Set(undocumented)) {
    const uNorm = normRoute(u);
    const head = headOf(uNorm);
    const candidates = claimedByHead.get(head) ?? [];

    // exact/family/param coverage
    if (candidates.some(c => routeCovers(c, uNorm) || routeCovers(uNorm, c))) {
      alreadyClaimed.push(u);
      continue;
    }

    // base head claimed but no family: e.g., have "/events" but not "/events/*"
    if (candidates.some(c => normRoute(c) === head)) {
      partiallyClaimed.push(u);
      continue;
    }

    trulyNew.push(u);
  }

  return { alreadyClaimed, partiallyClaimed, trulyNew };
}
