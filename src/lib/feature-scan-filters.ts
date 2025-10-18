/**
 * Feature Scanner Filters
 * Separates product surfaces from system noise (PostGIS, extensions, etc.)
 */

export const routeIgnore = [
  /^\/admin\//,
  /^\/preview\//,
  /^\/dev\//,
  /^\/health$/,
];

export const rpcIgnore = [
  /^st_/i,
  /^postgis_/i,
  /^geometry/i,
  /^geography/i,
  /^pgis_/i,
  /^gtrgm/i,
  /^vector/i,
  /^sparsevec/i,
  /^halfvec/i,
  /^word_similarity/i,
  /^(sum|min|max|avg|text|box|point|polygon|bytea|citext)\b/i, // built-ins & types
  /^citext/i,
  /^regexp_/i,
  /^textic/i,
  /^strpos/i,
  /^replace/i,
  /^split_part/i,
  /^translate/i,
];

export const rpcAllow = [
  /^(ai_|admin_|cart_|order_|entity_|entry_|event_|crm_|calendar_|notif|feed_|feature_|get_|has_|is_|rocker_|search_|save_item|unsave_item|slugify|payout|price_test|dm_send|record_view|reorder_pins|reposts_list|rpc_|check_|log_|post_|favorite|connection_|entitlement_|draw_|reservation_|claim_|can_|decrement_|contributor_|cleanup_)/,
];

export const tableIgnore = [
  /^spatial_ref_sys$/,
  /^geography_columns$/,
  /^geometry_columns$/,
  /^raster_/,
  /^pg_/,
  /^_/,
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
 * /events/123 and /events/456/details → /events/*
 */
export function collapseFamilies(paths: string[]): string[] {
  const families = new Map<string, Set<string>>();
  
  for (const raw of paths) {
    const p = normRoute(raw);
    const parts = p.split('/').filter(Boolean);
    const head = '/' + (parts[0] ?? '');
    
    if (!families.has(head)) {
      families.set(head, new Set());
    }
    
    // If more than 2 segments, it's part of a family
    if (parts.length > 2) {
      families.get(head)!.add(`${head}/*`);
    } else {
      families.get(head)!.add(p || '/');
    }
  }
  
  // Flatten and dedupe
  const result = new Set<string>();
  for (const routes of families.values()) {
    for (const route of routes) {
      result.add(route);
    }
  }
  
  return [...result].sort();
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
