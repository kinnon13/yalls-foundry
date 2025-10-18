/**
 * Feature Flag Router Guard
 * Respects flags when registering routes and rendering components
 */

import { getFlag, type FlagKey } from '@/lib/flags/index';
import type { ReactNode } from 'react';

export interface FlaggedRoute {
  path: string;
  flag?: FlagKey;
  element: ReactNode;
}

/**
 * Check if a route should be accessible based on its feature flag
 */
export function isRouteEnabled(flag?: FlagKey): boolean {
  if (!flag) return true; // No flag = always enabled
  return getFlag(flag);
}

/**
 * Filter routes based on feature flags
 */
export function filterEnabledRoutes(routes: FlaggedRoute[]): FlaggedRoute[] {
  return routes.filter(route => isRouteEnabled(route.flag));
}

/**
 * Get all enabled route paths (for router registration)
 */
export function getEnabledPaths(routes: FlaggedRoute[]): string[] {
  return filterEnabledRoutes(routes).map(r => r.path);
}

/**
 * Guard component for flag-gated routes
 */
export function FlagGuard({ 
  flag, 
  children, 
  fallback = null 
}: { 
  flag?: FlagKey; 
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!isRouteEnabled(flag)) {
    return fallback;
  }
  return children;
}
