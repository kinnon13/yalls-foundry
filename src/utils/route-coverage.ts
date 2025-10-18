/**
 * Route Coverage Classification
 * Determines which undocumented routes are already claimed vs truly new
 */

import { normRoute } from '@/lib/feature-scan-filters';

/** single-segment wildcard match: :param matches any one segment */
function segMatch(a: string, b: string) {
  return a === b || a.startsWith(':') || b.startsWith(':');
}

function isFamily(p: string) { 
  return p.endsWith('/*'); 
}

function familyHead(p: string) { 
  return p.replace(/\/\*$/, ''); 
}

/** true if A covers B (A may be a route, param route, or family) */
export function routeCovers(aRaw: string, bRaw: string) {
  const a = normRoute(aRaw);
  const b = normRoute(bRaw);

  if (a === b) return true;

  // family coverage
  if (isFamily(a)) {
    const head = familyHead(a);
    return b === head || b.startsWith(head + '/');
  }
  if (isFamily(b)) {
    const head = familyHead(b);
    // exact or parent coverage counts as covered either way
    return a === head || a.startsWith(head + '/');
  }

  // param-aware same-depth match
  const as = a.split('/').filter(Boolean);
  const bs = b.split('/').filter(Boolean);
  if (as.length !== bs.length) return false;
  for (let i = 0; i < as.length; i++) {
    if (!segMatch(as[i], bs[i])) return false;
  }
  return true;
}

/** Classify undocumented families against claimed routes */
export function classifyUndocRoutes(
  undocFamilies: string[],
  claimedRoutes: string[]
) {
  const claimed = [...new Set(claimedRoutes.map(normRoute))];

  const alreadyClaimed: string[] = [];
  const partiallyClaimed: string[] = [];
  const trulyNew: string[] = [];

  for (const u of undocFamilies) {
    const uNorm = normRoute(u);

    // covered by any claimed route/family/param?
    const covered = claimed.some(c => routeCovers(c, uNorm) || routeCovers(uNorm, c));
    if (covered) {
      alreadyClaimed.push(u);
      continue;
    }

    // same head present (e.g., '/events' claimed but not '/events/*')
    const head = '/' + (uNorm.split('/').filter(Boolean)[0] ?? '');
    const sameHeadClaimed = claimed.some(c => normRoute(c) === head);
    if (sameHeadClaimed) {
      partiallyClaimed.push(u);
      continue;
    }

    trulyNew.push(u);
  }

  return { alreadyClaimed, partiallyClaimed, trulyNew };
}
