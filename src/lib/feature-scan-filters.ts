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
  /^(feed_|post_|entry_|draw_|cart_|order_|reservation_|payout_|search_|entity_|profile_|crm_|calendar_|notif|notification_|rocker_|feature_|price_|ai_|match_|get_|set_|update_|admin_|handle_|claim_|linked_|repost|favorite|marketplace_|farm_|incentive_|dm_|save_|unsave_|record_|decrement_|log_|check_|contributor_|cleanup_|slugify)/i,
];

export const rpcIgnore = [
  /^_/i,
  /^st_/i,
  /^_st_/i,
  /^postgis_/i,
  /^pgis_/i,
  /^(geometry|geography|gtrgm|gin_trgm|vector|halfvec|sparsevec|ivfflat|hnsw)/i,
  /^(sum|avg|max|min|count|json|jsonb|text|box|point|polygon|regexp_|split_part|strpos|equals|citext|textic|replace|translate)$/i,
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
 */
export function normRoute(p: string): string {
  return (p || '/')
    .replace(/\/index$/, '')
    .replace(/\/+$/, '')
    .replace(/\[([^\]]+)\]/g, ':$1')
    .replace(/\/\d+([\/$]|$)/g, '/:id$1')
    .replace(/\/[0-9a-f-]{8,}([\/$]|$)/i, '/:id$1') || '/';
}

/**
 * Collapse route families - group related routes
 * Uses controlled list of heads that should be collapsed
 */
export function collapseFamilies(paths: string[]): string[] {
  const families = new Map<string, Set<string>>();
  const norm = (p: string) => ('/' + p).replace(/\/+/g, '/');

  for (const raw of paths) {
    const p = norm(raw);
    const parts = p.split('/').filter(Boolean);
    const head = '/' + (parts[0] ?? '');

    if (!families.has(head)) {
      families.set(head, new Set());
    }

    // Collapse everything under selected heads (except bare head)
    if (COLLAPSE_HEADS.has(head) && parts.length >= 2) {
      families.get(head)!.add(`${head}/*`);
    } else {
      families.get(head)!.add(p || '/');
    }
  }

  // Flatten + stable sort
  return [...new Set([...families.values()].flatMap(s => [...s]))].sort();
}

/**
 * Collapse monthly/partition tables into a single label
 * e.g. "crm_events_2025_10_v2" -> "crm_events_*"
 */
export function collapsePartitions(names: string[]): string[] {
  const base = (n: string) => n.replace(/_\d{4}_\d{2}(?:_v\d+)?$/i, '_*');
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
