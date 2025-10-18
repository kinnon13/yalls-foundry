/**
 * Feature Scanner Filters
 * Separates product surfaces from system noise (PostGIS, extensions, etc.)
 */

// Which route heads should be collapsed into `/<head>/*`
const COLLAPSE_HEADS = new Set([
  '/events',
  '/marketplace',
  '/messages',
  '/orders',
  '/farm',
  '/entrant',
  '/entities',
  '/listings',
  '/profile',
  '/stallions',
  '/cart',
]);

export const routeIgnore = [
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
 * Normalize route paths - collapse params and trailing slashes
 * Global replacement for all numeric/UUID segments
 */
export function normRoute(p: string): string {
  return (p || '/')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')
    .replace(/\/\d+(?:[\/$]|$)/g, '/:id$1')
    .replace(/\/[0-9a-f-]{8,}(?:[\/$]|$)/ig, '/:id$1') || '/';
}

/**
 * Collapse route families - group related routes
 * Uses controlled list of heads that should be collapsed
 */
export function collapseFamilies(paths: string[]): string[] {
  const families = new Map<string, Set<string>>();
  const add = (h: string, v: string) => {
    if (!families.has(h)) families.set(h, new Set());
    families.get(h)!.add(v);
  };

  for (const raw of paths) {
    const p = normRoute(('/' + raw).replace(/\/+/g, '/'));
    const parts = p.split('/').filter(Boolean);
    const head = '/' + (parts[0] ?? '');
    
    if (COLLAPSE_HEADS.has(head) && parts.length >= 2) {
      add(head, `${head}/*`);
    } else {
      add(head, p || '/');
    }
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
