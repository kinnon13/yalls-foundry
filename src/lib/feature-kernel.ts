/**
 * Feature Kernel
 * Merges base + overlays + generated sources
 * Base: docs/features/features.json (curated)
 * Overlays: docs/features/*-complete.json (optional extensions)
 * Generated: generated/feature-*.json (scanner/backfill outputs)
 */

type FeatureStatus = 'shell' | 'full-ui' | 'wired';

export interface Feature {
  id: string;
  area: string;
  title: string;
  status: FeatureStatus;
  routes: string[];
  components: string[];
  rpc?: string[];
  flags?: string[];
  docs?: string;
  tests: { unit: string[]; e2e: string[] };
  owner?: string;
  severity?: 'p0' | 'p1' | 'p2';
  notes?: string;
  gold_path?: boolean;
  user_facing?: boolean;
  parentFeature?: string;
  subFeatures?: string[];
}

// 1) Base (curated metadata)
import baseJson from '../../docs/features/features.json';

// 2) Optional overlays (e.g. features-complete.json)
const overlayMatches = import.meta.glob('../../docs/features/*-complete.json', {
  eager: true,
  import: 'default',
}) as Record<string, any>;

// 3) Generated/backfilled sources (don't commit hand edits here)
const generatedMatches = import.meta.glob('../../generated/feature-*.json', {
  eager: true,
  import: 'default',
}) as Record<string, any>;

// Extract feature arrays
const extractFeatures = (obj: any): Feature[] => {
  if (Array.isArray(obj)) return obj as Feature[];
  if (obj?.features && Array.isArray(obj.features)) return obj.features as Feature[];
  return [];
};

const base = extractFeatures(baseJson);
const overlays = Object.values(overlayMatches).flatMap(m => extractFeatures(m));
const generated = Object.values(generatedMatches).flatMap(m => extractFeatures(m));

// Status ranking (for merge precedence)
const statusRank: Record<FeatureStatus, number> = { shell: 0, 'full-ui': 1, wired: 2 };

function uniq<T>(arr: T[] = []): T[] {
  return Array.from(new Set(arr));
}

function mergeLists(...lists: Feature[][]): Feature[] {
  const map = new Map<string, Feature>();
  
  for (const list of lists) {
    for (const f of list) {
      const prev = map.get(f.id);
      
      if (!prev) {
        // First occurrence - normalize arrays
        map.set(f.id, {
          ...f,
          routes: uniq(f.routes ?? []),
          components: uniq(f.components ?? []),
          rpc: uniq(f.rpc ?? []),
          flags: uniq(f.flags ?? []),
          tests: {
            unit: uniq(f.tests?.unit ?? []),
            e2e: uniq(f.tests?.e2e ?? [])
          },
        });
        continue;
      }
      
      // Merge with precedence (stronger status wins, combine arrays)
      const status: FeatureStatus =
        statusRank[f.status] > statusRank[prev.status] ? f.status : prev.status;
      
      map.set(f.id, {
        ...prev,
        ...f, // Overlay can update title/owner/area/severity/notes
        status,
        routes: uniq([...(prev.routes ?? []), ...(f.routes ?? [])]),
        components: uniq([...(prev.components ?? []), ...(f.components ?? [])]),
        rpc: uniq([...(prev.rpc ?? []), ...(f.rpc ?? [])]),
        flags: uniq([...(prev.flags ?? []), ...(f.flags ?? [])]),
        tests: {
          unit: uniq([...(prev.tests?.unit ?? []), ...(f.tests?.unit ?? [])]),
          e2e: uniq([...(prev.tests?.e2e ?? []), ...(f.tests?.e2e ?? [])]),
        },
      });
    }
  }
  
  return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}

export const features = mergeLists(base, overlays, generated);

export const featureSources = {
  base: base.length,
  overlays: overlays.length,
  generated: generated.length,
};

// Log what was loaded
if (featureSources.overlays === 0 && featureSources.generated === 0) {
  console.info('[Feature Kernel] Base only (no overlays/generated found)');
} else {
  console.info(
    `[Feature Kernel] Loaded ${features.length} features ` +
    `(base=${featureSources.base}, overlay=${featureSources.overlays}, generated=${featureSources.generated})`
  );
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
 * Feature Kernel - Central API
 */
export const kernel = {
  features,
  sources: featureSources,
  
  getFeature(id: string): Feature | null {
    return features.find(f => f.id === id) ?? null;
  },
  
  getStatus(id: string): FeatureStatus | null {
    return this.getFeature(id)?.status ?? null;
  },
  
  getByStatus(status: FeatureStatus): Feature[] {
    return features.filter(f => f.status === status);
  },
  
  getByArea(area: string): Feature[] {
    return features.filter(f => f.area === area);
  },
  
  isAccessible(id: string, env = import.meta.env.MODE): boolean {
    const feature = this.getFeature(id);
    
    if (!feature) return env !== 'production';
    
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
  
  validateGoldPath(): { ready: boolean; blocking: string[] } {
    const blocking: string[] = [];
    
    for (const id of GOLD_PATH_FEATURES) {
      const feature = this.getFeature(id);
      if (!feature || feature.status === 'shell') {
        blocking.push(id);
      }
    }
    
    return { ready: blocking.length === 0, blocking };
  },
  
  getStats() {
    const byStatus: Record<FeatureStatus, number> = {
      'shell': 0,
      'full-ui': 0,
      'wired': 0
    };
    
    const byArea: Record<string, Record<FeatureStatus, number>> = {};
    
    for (const f of features) {
      byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;
      
      if (!byArea[f.area]) {
        byArea[f.area] = { shell: 0, 'full-ui': 0, wired: 0 };
      }
      byArea[f.area][f.status] = (byArea[f.area][f.status] ?? 0) + 1;
    }
    
    const total = features.length;
    const complete = (byStatus['full-ui'] || 0) + (byStatus['wired'] || 0);
    const completionPercent = (complete / Math.max(1, total)) * 100;
    
    return {
      total,
      byStatus,
      byArea,
      completionPercent,
      sources: featureSources,
      withTests: features.filter(f => (f.tests?.e2e?.length ?? 0) > 0 || (f.tests?.unit?.length ?? 0) > 0).length,
      withDocs: features.filter(f => f.docs && f.docs.length > 0).length,
      withOwner: features.filter(f => f.owner && f.owner.length > 0).length
    };
  }
} as const;

// Export convenience helpers
export const getById = (id: string) => kernel.getFeature(id);
export const getFeaturesByStatus = (s: FeatureStatus) => kernel.getByStatus(s);
export const getFeatureStatus = (id: string) => kernel.getStatus(id);
export const { isAccessible, validateGoldPath, getStats } = kernel;
export const allFeatures = features;
export const stats = { total: features.length };

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
