/**
 * Feature Scanner Filters
 * Separates product surfaces from system noise (PostGIS, extensions, etc.)
 */

// Route aliases for canonical naming
const ROUTE_ALIASES: Record<string, string> = {
  '/entrant': '/entries',
  '/dashboard': '/workspace',
  '/incentives/dashboard': '/workspace',
  '/crm': '/workspace',
};

// Which route heads should be collapsed into `/<head>/*`
const COLLAPSE_HEADS = new Set([
  '/events',
  '/marketplace',
  '/messages',
  '/orders',
  '/farm',
  '/entries',
  '/entities',
  '/listings',
  '/profile',
  '/stallions',
  '/cart',
  '/organizer',
  '/workspace',
]);

// Route categories for filtering/display
export const ROUTE_CATEGORIES: Record<string, string> = {
  '/events': 'public',
  '/entries': 'private',
  '/organizer': 'organizer',
  '/workspace': 'workspace',
  '/marketplace': 'public',
};

export const routeIgnore = [
  /^\/$/,                               // root/home page
  /^\/preview($|\/)/,
  /^\/health$/,
  /^\/admin\/(components|a11y|tests|routes)$/,
];

export const rpcAllow = [
  /^(ai_|admin_|cart_|order_|marketplace_|entity_|entry_|draw_|reservation_|payout_|price_|dm_|feed_|feature_|notif(?:ication)?_|rocker_|crm_|calendar_)/i,
  /^(get|set|update)_(user_|entity_|profile_|cart_|order_|calendar_|feature_|price|payout|crm_|notif)/i,
];

export const rpcIgnore = [
  /^_/i,
  /^st_/i,
  /^_st_/i,
  /^postgis_/i,
  /^pgis_/i,
  /^(geometry|geography|gtrgm|gin_trgm|vector|halfvec|sparsevec|ivfflat|hnsw)/i,
  /^(get_proj4_from_srid|find_srid)$/i,
  /^(sum|avg|max|min|count|json|jsonb|text|box|point|polygon|citext)\b/i,
  /^regexp_/i,
  /^textic/i,
  /^strpos/i,
  /^replace$/i,
  /^split_part$/i,
  /^translate$/i,
];

export const tableIgnore = [
  /^spatial_ref_sys$/i,
  /^pg_/i,
  /^information_schema\./i,
  /^geography_columns$/i,
  /^geometry_columns$/i,
  /^raster_/i,
];

/**
 * Apply route aliases (e.g., /entrant → /entries)
 */
export function applyRouteAlias(p: string): string {
  const parts = p.split('/').filter(Boolean);
  if (parts.length === 0) return p;
  
  const head = '/' + parts[0];
  if (ROUTE_ALIASES[head]) {
    parts[0] = ROUTE_ALIASES[head].slice(1); // remove leading /
    return '/' + parts.join('/');
  }
  return p;
}

/**
 * Check if route is a workspace route
 */
export function isWorkspaceRoute(p: string): boolean {
  const normalized = normRoute(applyRouteAlias(p));
  return normalized.startsWith('/workspace');
}

/**
 * Get workspace entity ID from route if present
 */
export function getWorkspaceEntityId(p: string): string | null {
  const normalized = normRoute(applyRouteAlias(p));
  const match = normalized.match(/^\/workspace\/([^/]+)/);
  if (match && match[1] !== 'personal') {
    return match[1]; // Return :id placeholder or actual ID
  }
  return null;
}

/**
 * Get route category (public/private/organizer/workspace)
 */
export function getRouteCategory(p: string): string | null {
  const normalized = normRoute(applyRouteAlias(p));
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  
  const head = '/' + parts[0];
  return ROUTE_CATEGORIES[head] || null;
}

/**
 * Normalize route paths - collapse params and trailing slashes
 * Canonicalize all params to :id, strip query/hash, use strict UUID pattern
 */
export function normRoute(p: string): string {
  const aliased = applyRouteAlias(p);
  const s = (aliased || '/')
    .split('?')[0]                        // strip query string
    .split('#')[0]                        // strip hash
    .replace(/\/index$/, '')
    .replace(/\/+$/g, '')                 // trim trailing slash
    .replace(/\[([^\]]+)\]/g, ':$1')      // file-based params → :name
    .replace(/\/:([A-Za-z][\w-]*)/g, '/:id') // any :name → :id (canonical)
    .replace(/\/\d+(?=\/|$)/g, '/:id')    // numeric ids
    // strict UUID (v1-v5) to avoid clobbering slugs like "dead-beef-burger"
    .replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?=\/|$)/gi,
      '/:id'
    );
  return s || '/';
}

/**
 * Collapse route families - group related routes
 * Uses controlled list of heads that should be collapsed
 */
export function collapseFamilies(paths: string[]): string[] {
  const families = new Map<string, Set<string>>();
  
  for (const raw of paths) {
    const p = normRoute(('/' + raw).replace(/\/+/g, '/'));
    const parts = p.split('/').filter(Boolean);
    const head = '/' + (parts[0] ?? '');
    const set = families.get(head) ?? new Set<string>();
    
    if (COLLAPSE_HEADS.has(head) && parts.length >= 2) {
      set.add(`${head}/*`);
    } else {
      set.add(p || '/');
    }
    
    families.set(head, set);
  }

  // If /* family exists for a head, drop the bare head to avoid duplicates
  for (const [head, set] of families) {
    if (set.has(`${head}/*`)) set.delete(head);
  }

  // Flatten + stable sort
  return [...new Set([...families.values()].flatMap(s => [...s]))].sort();
}

/**
 * Collapse monthly/partition tables into a single label
 * Handles: YYYY_MM[_DD][_vN], _old, _default, _partitioned
 */
export function collapsePartitions(names: string[]): string[] {
  const base = (n: string) =>
    n
      .replace(/_\d{4}_\d{2}(?:_\d{2})?(?:_v\d+)?$/i, '_*')
      .replace(/_(?:old|default|partitioned)$/i, '_*');
  return [...new Set(names.map(base))].sort();
}

/**
 * Check if RPC is a product function (not system/extension)
 */
export function isProductRpc(name: string): boolean {
  return rpcAllow.some(r => r.test(name)) && !rpcIgnore.some(r => r.test(name));
}

/**
 * Check if route should be tracked
 */
export function isProductRoute(path: string): boolean {
  return !routeIgnore.some(r => r.test(path));
}

/**
 * Check if table is a product table
 */
export function isProductTable(name: string): boolean {
  return !tableIgnore.some(r => r.test(name));
}
