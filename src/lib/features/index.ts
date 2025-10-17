/**
 * Unified Feature Index
 * Single source of truth for all features
 */

export type FeatureStatus = 'shell' | 'full-ui' | 'wired';
export type FeatureArea = 'profile' | 'notifications' | 'composer' | 'events' | 'producer' | 'earnings' | 'ai' | 'admin' | 'other';

export interface Feature {
  id: string;
  area: FeatureArea;
  title: string;
  status: FeatureStatus;
  routes: string[];
  components: string[];
  rpc: string[];
  flags: string[];
  docs: string;
  tests: { unit: string[]; e2e: string[] };
  owner: string;
  severity: 'p0' | 'p1' | 'p2' | string;
  notes?: string;
  gold_path?: boolean;
  user_facing?: boolean;
  parent_id?: string;
  parentFeature?: string;
  subFeatures?: string[];
  type?: 'feature' | 'capability' | 'tech';
}

// Load JSON sources
import baseJson from '../../../docs/features/features.json';
import completeJson from '../../../docs/features/features-complete.json';

interface FeaturesFile {
  features: Feature[];
}

const baseList: Feature[] = ((baseJson as FeaturesFile).features || []) as Feature[];
const completeList: Feature[] = ((completeJson as FeaturesFile).features || []) as Feature[];

/**
 * Deep merge two features, combining arrays
 */
function mergeFeature(a: Feature, b: Feature): Feature {
  return {
    ...a,
    ...b,
    routes: Array.from(new Set([...(a.routes || []), ...(b.routes || [])])),
    components: Array.from(new Set([...(a.components || []), ...(b.components || [])])),
    rpc: Array.from(new Set([...(a.rpc || []), ...(b.rpc || [])])),
    flags: Array.from(new Set([...(a.flags || []), ...(b.flags || [])])),
    tests: {
      unit: Array.from(new Set([...(a.tests?.unit || []), ...(b.tests?.unit || [])])),
      e2e: Array.from(new Set([...(a.tests?.e2e || []), ...(b.tests?.e2e || [])])),
    },
  };
}

// Merge all sources, preferring later entries
const map = new Map<string, Feature>();
for (const f of baseList) map.set(f.id, f);
for (const f of completeList) {
  map.set(f.id, map.has(f.id) ? mergeFeature(map.get(f.id)!, f) : f);
}

export const features: Feature[] = Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
export const allFeatures = features; // alias for clarity

export const stats = {
  total: features.length,
};

/**
 * Get feature by ID
 */
export function getById(id: string): Feature | undefined {
  return features.find(f => f.id === id);
}

/**
 * Get features by status
 */
export function getFeaturesByStatus(status: FeatureStatus): Feature[] {
  return features.filter(f => f.status === status);
}

/**
 * Get comprehensive feature statistics
 */
export function getFeatureStats() {
  const byStatus = features.reduce<Record<FeatureStatus, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] ?? 0) + 1;
    return acc;
  }, { 'shell': 0, 'full-ui': 0, 'wired': 0 });

  const byArea = features.reduce<Record<string, Record<FeatureStatus, number>>>((acc, f) => {
    acc[f.area] ??= { shell: 0, 'full-ui': 0, wired: 0 };
    acc[f.area][f.status] = (acc[f.area][f.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: features.length,
    byStatus,
    byArea,
    completionPercent: ((byStatus['full-ui'] || 0) + (byStatus['wired'] || 0)) / Math.max(1, features.length) * 100
  };
}

/**
 * Gold-path critical features
 */
export const GOLD_PATH_FEATURES = [
  'profile_pins', 'favorites', 'reposts', 'linked_accounts', 'entity_edges',
  'composer_core', 'composer_crosspost', 'composer_schedule',
  'notification_lanes', 'notification_prefs', 'notification_digest',
  'events_discounts', 'events_waitlist',
  'producer_console_overview', 'producer_registrations', 'producer_financials', 'producer_export_csv',
  'earnings_tiers', 'earnings_missed', 'orders_refund_flow',
  'ai_context_compiler', 'ai_memory', 'ai_nba_ranker', 'ai_modal', 'ai_explainability'
];

/**
 * Environment checks
 */
export const isProd = import.meta.env.PROD && !new URLSearchParams(window.location.search).get('dev');
export const isDev = import.meta.env.DEV || new URLSearchParams(window.location.search).get('dev') === '1';

/**
 * Check if feature is accessible (prod shell guard)
 */
export function isFeatureAccessible(featureId: string): boolean {
  const feature = getById(featureId);

  if (!feature) {
    console.warn(`[FeatureGuard] Unknown feature: ${featureId}`);
    return isDev;
  }

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
  return getById(featureId)?.status || null;
}

/**
 * Validate gold-path readiness
 */
export function validateGoldPath(): { ready: boolean; blocking: string[] } {
  const blocking: string[] = [];

  for (const id of GOLD_PATH_FEATURES) {
    const feature = getById(id);
    if (!feature || feature.status === 'shell') {
      blocking.push(id);
    }
  }

  return {
    ready: blocking.length === 0,
    blocking
  };
}

declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, context?: any) => void;
    };
  }
}
