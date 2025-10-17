/**
 * Feature Guard System
 * Enforces that shell features never appear in production
 */

import { features as allFeatures } from './featuresData';

type FeatureStatus = 'shell' | 'full-ui' | 'wired';

interface Feature {
  id: string;
  status: FeatureStatus;
  area: string;
  title: string;
}

declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, context?: any) => void;
    };
  }
}

const featuresList = allFeatures as unknown as Feature[];

const isDev = import.meta.env.DEV || new URLSearchParams(window.location.search).get('dev') === '1';
const isProd = import.meta.env.PROD && !isDev;

/**
 * Check if a feature should be accessible
 */
export function isFeatureAccessible(featureId: string): boolean {
  const feature = featuresList.find(f => f.id === featureId);
  
  if (!feature) {
    console.warn(`[FeatureGuard] Unknown feature: ${featureId}`);
    return isDev; // Only show unknown features in dev
  }

  // In prod, hide shells
  if (isProd && feature.status === 'shell') {
    console.warn(`[FeatureGuard] Blocking shell feature in prod: ${featureId}`);
    if (window.Sentry) {
      window.Sentry.captureMessage('shell_component_used', {
        level: 'warning',
        tags: { feature_id: featureId },
        extra: { route: window.location.pathname }
      });
    }
    return false;
  }

  return true;
}

/**
 * Get feature status
 */
export function getFeatureStatus(featureId: string): FeatureStatus | null {
  const feature = featuresList.find(f => f.id === featureId);
  return feature?.status || null;
}

/**
 * Get all features by status
 */
export function getFeaturesByStatus(status: FeatureStatus): Feature[] {
  return featuresList.filter(f => f.status === status);
}

/**
 * Get feature completion stats
 */
export function getFeatureStats() {
  const total = featuresList.length;
  const byStatus = featuresList.reduce((acc: Record<string, number>, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const byArea = featuresList.reduce((acc: Record<string, Record<string, number>>, f) => {
    if (!acc[f.area]) acc[f.area] = { shell: 0, 'full-ui': 0, wired: 0 };
    acc[f.area][f.status] = (acc[f.area][f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  return {
    total,
    byStatus,
    byArea,
    completionPercent: ((byStatus['full-ui'] || 0) + (byStatus['wired'] || 0)) / total * 100
  };
}

/**
 * Check if gold-path features are ready
 */
export const GOLD_PATH_FEATURES = [
  'profile_pins',
  'favorites',
  'reposts',
  'linked_accounts',
  'entity_edges',
  'composer_core',
  'composer_crosspost',
  'composer_schedule',
  'notification_lanes',
  'notification_prefs',
  'notification_digest',
  'events_discounts',
  'events_waitlist',
  'producer_console_overview',
  'producer_registrations',
  'producer_financials',
  'producer_export_csv',
  'earnings_tiers',
  'earnings_missed',
  'orders_refund_flow',
  'ai_context_compiler',
  'ai_memory',
  'ai_nba_ranker',
  'ai_modal',
  'ai_explainability'
];

export function validateGoldPath(): { ready: boolean; blocking: string[] } {
  const blocking: string[] = [];
  
  for (const featureId of GOLD_PATH_FEATURES) {
    const feature = featuresList.find(f => f.id === featureId);
    if (!feature || feature.status === 'shell') {
      blocking.push(featureId);
    }
  }
  
  return {
    ready: blocking.length === 0,
    blocking
  };
}
