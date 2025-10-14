/**
 * Feature Flags
 * 
 * Environment-based feature gates for gradual rollouts.
 * Extend with database-backed flags for per-user control.
 * 
 * Usage:
 *   import { isFeatureEnabled } from '@/lib/availability/featureFlags';
 *   if (isFeatureEnabled('new_search')) { ... }
 */

import { config } from '@/lib/config';

export type FeatureFlag =
  | 'new_search'
  | 'rocker_ai'
  | 'vector_search'
  | 'advanced_analytics'
  | 'experimental_ui';

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  // Development: all features enabled
  if (config.NODE_ENV === 'development') {
    return true;
  }

  // Production: check environment variables
  const envKey = `VITE_FEATURE_${flag.toUpperCase()}`;
  const value = import.meta.env[envKey];
  return value === 'true';
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): FeatureFlag[] {
  const allFlags: FeatureFlag[] = [
    'new_search',
    'rocker_ai',
    'vector_search',
    'advanced_analytics',
    'experimental_ui',
  ];

  return allFlags.filter(isFeatureEnabled);
}

/**
 * TODO: Database-backed feature flags
 * 
 * For per-user or gradual rollout, create:
 * - feature_flags table with flag name, enabled %, user allowlist
 * - Check database before environment fallback
 * - Cache flag state in L1/L2 cache
 * - Invalidate on admin changes
 */