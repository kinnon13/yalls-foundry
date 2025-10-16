/**
 * Route Redirect Rules
 * 
 * Handles legacy route redirects for consolidated architecture.
 * All redirects preserve query params and enforce 7-route spine.
 */

export const REDIRECT_RULES: Record<string, string> = {
  // Calendar consolidation
  '/calendar': '/dashboard?tab=calendar',
  
  // MLM consolidation
  '/mlm/dashboard': '/dashboard?tab=mlm',
  '/mlm/tree': '/dashboard?tab=mlm',
  
  // Cart/Checkout → marketplace modals
  '/cart': '/marketplace?view=cart',
  '/checkout': '/marketplace?view=checkout',
  
  // Horses → search/profile
  '/horses': '/search?category=horses',
  '/horses/create': '/dashboard?tab=profiles&action=create&type=horse',
  
  // Events → search/dashboard
  '/events': '/search?category=events',
  '/events/create': '/dashboard?tab=events&action=create',
  
  // Business routes → dashboard
  '/business/:bizId/hub': '/dashboard?tab=business&id=:bizId',
  '/business/:bizId/settings/profile': '/dashboard?tab=business&id=:bizId&section=profile',
  '/business/:bizId/settings/payments': '/dashboard?tab=business&id=:bizId&section=payments',
  '/business/:bizId/crm/contacts': '/dashboard?tab=crm&id=:bizId&view=contacts',
  '/business/:bizId/crm/leads': '/dashboard?tab=crm&id=:bizId&view=leads',
  
  // Saved posts → dashboard
  '/posts/saved': '/dashboard?tab=saved',
};

/**
 * Get redirect destination for a given path.
 * Returns null if no redirect needed.
 */
export function getRedirectDestination(path: string): string | null {
  // Direct match
  if (REDIRECT_RULES[path]) {
    return REDIRECT_RULES[path];
  }
  
  // Dynamic route matching (e.g., /horses/123 → /profile/123)
  if (path.startsWith('/horses/') && path !== '/horses/create') {
    const id = path.split('/')[2];
    return `/profile/${id}`;
  }
  
  if (path.startsWith('/events/') && path !== '/events/create') {
    const id = path.split('/')[2];
    return `/?eventId=${id}`; // Event modal over feed
  }
  
  return null;
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
