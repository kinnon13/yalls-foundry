/**
 * Route Redirects
 * 
 * Standardized to exactly 10 top-level routes.
 * Everything else redirects to overlays via ?app= or canonical paths.
 * 
 * THE 10 CANONICAL ROUTES:
 * 1. / — Home shell (split panes, overlays live here)
 * 2. /discover — Discover surface (For You / Trending / Latest)
 * 3. /dashboard — Single management surface (left-rail modules)
 * 4. /messages — Deep link to DMs (opens as overlay when coming from Home)
 * 5. /profile/:id — Public profile deep link (also opens as overlay from Home)
 * 6. /entities — Browse & claim entities
 * 7. /events — Events index/create
 * 8. /listings — Listings index/create
 * 9. /cart — Cart deep link (mock checkout)
 * 10. /orders — Orders list (detail at /orders/:id is allowed as a subroute)
 */

import areaConfig from '../../../configs/area-discovery.json';

// Comprehensive redirect map: everything → 10 canonical routes or overlays
export const ROUTE_REDIRECTS: Record<string, string> = {
  // Load area-specific aliases from config
  ...areaConfig.routeAliases,
  
  // === HOME SHELL ===
  '/home': '/',
  '/post-feed': '/',
  '/feed': '/',
  '/social': '/',
  
  // === AUTH ===
  '/signup': '/login',
  '/register': '/login',
  
  // === DISCOVER (already canonical) ===
  '/discover-v2': '/discover',
  '/search': '/discover',
  
  // === DASHBOARD (already canonical) ===
  // Subroutes collapse to query params
  '/ai-management': '/dashboard?tab=ai',
  '/settings/ai': '/dashboard?tab=ai',
  '/ai/activity': '/dashboard?tab=ai&view=activity',
  '/calendar': '/dashboard?tab=calendar',
  '/earnings': '/dashboard?tab=earnings',
  '/dashboard/overview': '/dashboard?tab=overview',
  '/dashboard/business': '/dashboard?tab=business',
  '/dashboard/settings': '/dashboard?tab=settings',
  '/dashboard/approvals': '/dashboard?tab=approvals',
  '/settings/notifications': '/dashboard?tab=settings&view=notifications',
  '/notifications': '/dashboard?tab=notifications',
  
  // === MESSAGES (already canonical) ===
  // DMs open as overlay from Home via /?app=messages
  
  // === PROFILE (already canonical) ===
  '/me': '/profile',
  '/profile': '/entities', // No-ID profile → entities browser
  
  // === ENTITIES (already canonical) ===
  '/entities/unclaimed': '/entities?filter=unclaimed',
  '/claim/:entityId': '/entities?claim=:entityId',
  '/admin/claims': '/dashboard?tab=admin&view=claims',
  
  // === STALLIONS → ENTITIES ===
  '/stallions': '/entities?type=stallion',
  '/stallions/:id': '/entities/:id',
  
  // === EVENTS (already canonical) ===
  // Event subroutes stay as subroutes
  '/events/new': '/events?action=new',
  '/incentives/dashboard': '/dashboard?tab=incentives',
  '/entrant/my-entries': '/events?tab=my-entries',
  '/entrant/my-draws': '/events?tab=my-draws',
  '/entrant/my-results': '/events?tab=my-results',
  
  // === LISTINGS (already canonical) ===
  '/listings/new': '/listings?action=new',
  
  // === MARKETPLACE → LISTINGS ===
  '/marketplace': '/listings',
  '/marketplace/:id': '/listings/:id',
  '/app-store': '/?app=app-store',
  '/store': '/?app=app-store',
  '/shop': '/listings',
  
  // === CART (already canonical) ===
  '/checkout': '/cart?step=checkout',
  
  // === ORDERS (already canonical) ===
  // Orders subroutes allowed
  
  // === FARM OPS → DASHBOARD ===
  '/farm/calendar': '/dashboard?tab=farm&view=calendar',
  '/farm/dashboard': '/dashboard?tab=farm',
  '/farm/boarder/:id': '/dashboard?tab=farm&view=boarder&id=:id',
  '/farm/tasks': '/dashboard?tab=farm&view=tasks',
  '/farm/health': '/dashboard?tab=farm&view=health',
  
  // === CRM → DASHBOARD or OVERLAY ===
  '/crm': '/?app=crm',
  
  // === ADMIN → DASHBOARD ===
  '/admin/control-room': '/dashboard?tab=admin',
  '/admin/features': '/dashboard?tab=admin&view=features',
  '/admin/routes': '/dashboard?tab=admin&view=routes',
  '/admin/components': '/dashboard?tab=admin&view=components',
  '/admin/a11y': '/dashboard?tab=admin&view=a11y',
  '/admin/audit': '/dashboard?tab=admin&view=audit',
  '/admin/tests': '/dashboard?tab=admin&view=tests',
  '/admin/stubs': '/dashboard?tab=admin&view=stubs',
  
  // === LEGACY / DEPRECATED ===
  '/horses': '/entities?type=horse',
  '/horses/create': '/dashboard?tab=entities&action=create&type=horse',
  '/horses/:id': '/entities/:id',
  '/business/:bizId/hub': '/dashboard?tab=business&id=:bizId',
  '/business/:bizId/settings/profile': '/dashboard?tab=business&id=:bizId&section=profile',
  '/business/:bizId/settings/payments': '/dashboard?tab=business&id=:bizId&section=payments',
  '/business/:bizId/crm/contacts': '/dashboard?tab=business&id=:bizId&view=contacts',
  '/business/:bizId/crm/leads': '/dashboard?tab=business&id=:bizId&view=leads',
  '/posts/saved': '/dashboard?tab=saved',
  '/mlm/dashboard': '/dashboard?tab=mlm',
  '/mlm/tree': '/dashboard?tab=mlm',
};

/**
 * Get redirect destination for a given path.
 * Returns null if no redirect needed.
 */
export function getRedirectDestination(path: string): string | null {
  // Direct match
  if (ROUTE_REDIRECTS[path]) {
    return ROUTE_REDIRECTS[path];
  }
  
  // Check wildcard aliases from config
  for (const [alias, target] of Object.entries(areaConfig.routeAliases)) {
    if (alias.endsWith('/*')) {
      const prefix = alias.slice(0, -2);
      if (path.startsWith(prefix)) {
        const suffix = path.slice(prefix.length);
        return target.replace('/*', suffix);
      }
    }
  }
  
  // Dynamic route matching for patterns not in static map
  
  // Horses → Entities
  if (path.startsWith('/horses/') && path !== '/horses/create') {
    const id = path.split('/')[2];
    return `/entities/${id}`;
  }
  
  // Stallions → Entities
  if (path.startsWith('/stallions/') && !path.includes('/stallions')) {
    const id = path.split('/')[2];
    return `/entities/${id}`;
  }
  
  // Events with dynamic IDs are canonical (no redirect)
  // /events/:id and subroutes are allowed
  
  // Business dynamic routes → Dashboard
  if (path.startsWith('/business/')) {
    return '/dashboard?tab=business';
  }
  
  // Marketplace dynamic → Listings
  if (path.startsWith('/marketplace/') && path.split('/').length === 3) {
    const id = path.split('/')[2];
    return `/listings/${id}`;
  }
  
  return null;
}

/**
 * Resolve a route through aliases with parameter substitution
 * @param path - The original path
 * @param params - Route parameters to substitute (e.g., {entityId: 'abc'})
 * @returns The resolved canonical path
 */
export function resolveRoute(path: string, params?: Record<string, string>): string {
  const destination = getRedirectDestination(path);
  if (!destination) return path;
  
  return substituteParams(destination, params);
}

/**
 * Substitute route parameters in a path
 * @param path - Path with :param placeholders
 * @param params - Parameter values
 * @returns Path with substituted values
 */
function substituteParams(path: string, params?: Record<string, string>): string {
  if (!params) return path;
  
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}

/**
 * Apply redirect if needed, preserving query params.
 */
export function applyRedirect(
  currentPath: string,
  currentSearch: string,
  navigate: (to: string) => void
): boolean {
  const destination = getRedirectDestination(currentPath);
  
  if (!destination) return false;
  
  // Preserve query params
  const searchParams = new URLSearchParams(currentSearch);
  const destUrl = new URL(destination, window.location.origin);
  
  searchParams.forEach((value, key) => {
    if (!destUrl.searchParams.has(key)) {
      destUrl.searchParams.set(key, value);
    }
  });
  
  const finalPath = destUrl.pathname + destUrl.search;
  navigate(finalPath);
  
  return true;
}
