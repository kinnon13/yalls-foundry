/**
 * Deep-Link Bridge
 * Maps overlay apps to their canonical routes
 */

import type { AppId } from '@/apps/types';

// Contract map - manually sync with app contracts
const CONTRACT_ROUTES: Record<AppId, string[]> = {
  cart: ['/cart'],
  orders: ['/orders', '/orders/:id'],
  notifications: ['/notifications'],
  profile: ['/profile/:id'],
  entities: ['/entities', '/entities/:id'],
  mlm: ['/mlm', '/mlm/downline'],
  settings: ['/settings'],
  overview: ['/dashboard', '/owner'],
  
  // AI Assistants
  rocker: [],
  'admin-rocker': ['/admin-rocker'],
  andy: [],
  
  // Apps without dedicated routes (overlay-only)
  yallbrary: [],
  messages: [],
  marketplace: [],
  crm: [],
  calendar: [],
  discover: [],
  listings: [],
  events: [],
  earnings: [],
  incentives: [],
  'farm-ops': [],
  activity: [],
  analytics: [],
  favorites: [],
  business: [],
  producer: [],
};

/**
 * Get the base route for an app (first route in its contract)
 */
export function getBaseRouteFor(app: AppId): string | null {
  const routes = CONTRACT_ROUTES[app];
  if (!routes?.length) return null;
  return routes[0];
}

/**
 * Find which app owns a given pathname
 */
export function findAppForRoute(pathname: string): AppId | null {
  for (const [appId, routes] of Object.entries(CONTRACT_ROUTES)) {
    for (const route of routes) {
      // Simple match: /orders matches /orders and /orders/123
      const base = route.split(':')[0].replace(/\/$/, '');
      if (pathname === base || pathname.startsWith(base + '/')) {
        return appId as AppId;
      }
    }
  }
  return null;
}
