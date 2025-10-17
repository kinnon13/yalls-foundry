/**
 * Feature Kernel
 * Single source of truth for feature management
 * Loads JSON manifests and provides typed helpers + guards
 */

import featuresDoc from '../../docs/features/features.json';

export type FeatureStatus = 'shell' | 'full-ui' | 'wired';
export type FeatureArea = 'profile' | 'notifications' | 'composer' | 'events' | 'producer' | 'earnings' | 'ai' | 'admin' | 'marketplace' | 'business' | 'search' | 'orders' | 'messaging' | 'farm' | 'shipping' | 'settings' | 'platform' | 'other';

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
  parentFeature?: string;
  subFeatures?: string[];
}

interface FeaturesFile {
  features?: Feature[];
}

// Load base features
const loadedFeatures = (Array.isArray(featuresDoc) 
  ? featuresDoc 
  : (featuresDoc as FeaturesFile).features || []
) as Feature[];

// Try to load complete dataset (synchronous)
let completeFeatures: Feature[] = loadedFeatures;

try {
  // Synchronous import - will be tree-shaken if file doesn't exist
  const completeDoc = require('../../docs/features/features-complete.json');
  const completeList = (Array.isArray(completeDoc)
    ? completeDoc
    : (completeDoc as FeaturesFile).features || []
  ) as Feature[];
  
  if (completeList.length > 0) {
    // Deep merge: prefer completeList, combine arrays
    const map = new Map<string, Feature>();
    for (const f of loadedFeatures) map.set(f.id, f);
    for (const f of completeList) {
      if (map.has(f.id)) {
        const existing = map.get(f.id)!;
        map.set(f.id, {
          ...existing,
          ...f,
          routes: Array.from(new Set([...existing.routes, ...f.routes])),
          components: Array.from(new Set([...existing.components, ...f.components])),
          rpc: Array.from(new Set([...existing.rpc, ...f.rpc])),
          flags: Array.from(new Set([...existing.flags, ...f.flags])),
          tests: {
            unit: Array.from(new Set([...existing.tests.unit, ...f.tests.unit])),
            e2e: Array.from(new Set([...existing.tests.e2e, ...f.tests.e2e]))
          }
        });
      } else {
        map.set(f.id, f);
      }
    }
    completeFeatures = Array.from(map.values());
  }
} catch (err) {
  // If complete file doesn't exist or fails to load, use base features only
  console.info('[Feature Kernel] Using base features.json only');
}

// Sort by ID
completeFeatures.sort((a, b) => a.id.localeCompare(b.id));

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
 * Feature Kernel - Central API for feature management
 */
export const kernel = {
  /** All features (editable + generated merged) */
  features: completeFeatures,

  /** Get feature by ID */
  getFeature(id: string): Feature | null {
    return this.features.find(f => f.id === id) ?? null;
  },

  /** Get feature status */
  getStatus(id: string): FeatureStatus | null {
    return this.getFeature(id)?.status ?? null;
  },

  /** Get all features by status */
  getByStatus(status: FeatureStatus): Feature[] {
    return this.features.filter(f => f.status === status);
  },

  /** Get all features by area */
  getByArea(area: FeatureArea): Feature[] {
    return this.features.filter(f => f.area === area);
  },

  /** Get components for a feature */
  componentsFor(id: string): string[] {
    return this.getFeature(id)?.components ?? [];
  },

  /** Get routes for a feature */
  routesFor(id: string): string[] {
    return this.getFeature(id)?.routes ?? [];
  },

  /** Check if feature is accessible in current environment */
  isAccessible(id: string, env = import.meta.env.MODE): boolean {
    const feature = this.getFeature(id);
    
    // Unknown features only accessible in dev
    if (!feature) return env !== 'production';
    
    // Shell features blocked in production
    if (env === 'production' && feature.status === 'shell') {
      if (typeof window !== 'undefined' && window.Sentry) {
        window.Sentry.captureMessage('shell_component_used', {
          level: 'warning',
          tags: { feature_id: id },
          extra: { route: window.location?.pathname }
        });
      }
      return false;
    }
    
    return true;
  },

  /** Validate gold-path readiness */
  validateGoldPath(): { ready: boolean; blocking: string[] } {
    const blocking: string[] = [];
    
    for (const id of GOLD_PATH_FEATURES) {
      const feature = this.getFeature(id);
      if (!feature || feature.status === 'shell') {
        blocking.push(id);
      }
    }
    
    return {
      ready: blocking.length === 0,
      blocking
    };
  },

  /** Get comprehensive statistics */
  getStats() {
    const byStatus: Record<FeatureStatus, number> = this.features.reduce((acc, f) => {
      acc[f.status] = (acc[f.status] ?? 0) + 1;
      return acc;
    }, { 'shell': 0, 'full-ui': 0, 'wired': 0 } as Record<FeatureStatus, number>);

    const byArea: Record<string, Record<FeatureStatus, number>> = this.features.reduce((acc, f) => {
      acc[f.area] ??= { shell: 0, 'full-ui': 0, wired: 0 };
      acc[f.area][f.status] = (acc[f.area][f.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, Record<FeatureStatus, number>>);

    const total = this.features.length;
    const complete = (byStatus['full-ui'] || 0) + (byStatus['wired'] || 0);
    const completionPercent = (complete / Math.max(1, total)) * 100;

    return {
      total,
      byStatus,
      byArea,
      completionPercent,
      withTests: this.features.filter(f => f.tests.e2e.length > 0 || f.tests.unit.length > 0).length,
      withDocs: this.features.filter(f => f.docs && f.docs.length > 0).length,
      withOwner: this.features.filter(f => f.owner && f.owner.length > 0).length
    };
  }
} as const;

// Export convenience aliases
export const { features, getFeature, getStatus, getByStatus, getByArea, isAccessible, validateGoldPath, getStats } = kernel;
export const allFeatures = features;

// Environment checks
export const isProd = import.meta.env.PROD && !new URLSearchParams(typeof window !== 'undefined' ? window.location?.search : '').get('dev');
export const isDev = import.meta.env.DEV || new URLSearchParams(typeof window !== 'undefined' ? window.location?.search : '').get('dev') === '1';

// Type declarations
declare global {
  interface Window {
    Sentry?: {
      captureMessage: (message: string, context?: any) => void;
    };
  }
}
