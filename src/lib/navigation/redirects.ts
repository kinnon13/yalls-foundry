/**
 * Route Redirects
 * 
 * Canonical route aliases for backward compatibility.
 * Now loaded from configs/area-discovery.json
 */

import areaConfig from '../../../configs/area-discovery.json';

// Load aliases from config
export const ROUTE_REDIRECTS: Record<string, string> = {
  ...areaConfig.routeAliases,
  // Keep existing non-aliased redirects
  '/home': '/',
  '/post-feed': '/',
  '/signup': '/login',
  '/ai-management': '/dashboard?tab=ai',
  '/calendar': '/dashboard?tab=calendar',
  '/mlm/dashboard': '/dashboard?tab=mlm',
  '/mlm/tree': '/dashboard?tab=mlm',
  '/cart': '/marketplace?view=cart',
  '/checkout': '/marketplace?view=checkout',
  '/horses': '/search?category=horses',
  '/horses/create': '/dashboard?tab=profiles&action=create&type=horse',
  '/events': '/search?category=events',
  '/events/create': '/dashboard?tab=events&action=create',
  '/entities/unclaimed': '/search',
  '/business/:bizId/hub': '/dashboard?tab=business&id=:bizId',
  '/business/:bizId/settings/profile': '/dashboard?tab=business&id=:bizId&section=profile',
  '/business/:bizId/settings/payments': '/dashboard?tab=business&id=:bizId&section=payments',
  '/business/:bizId/crm/contacts': '/dashboard?tab=crm&id=:bizId&view=contacts',
  '/business/:bizId/crm/leads': '/dashboard?tab=crm&id=:bizId&view=leads',
  '/posts/saved': '/dashboard?tab=saved',
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
  
  // Dynamic route matching for other patterns
  if (path.startsWith('/horses/') && path !== '/horses/create') {
    const id = path.split('/')[2];
    return `/profile/${id}`;
  }
  
  if (path.startsWith('/events/') && path !== '/events/create') {
    const id = path.split('/')[2];
    return `/?eventId=${id}`;
  }
  
  if (path.startsWith('/business/')) {
    return '/dashboard';
  }
  
  // Profile without ID → search
  if (path === '/profile') {
    return '/search';
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
