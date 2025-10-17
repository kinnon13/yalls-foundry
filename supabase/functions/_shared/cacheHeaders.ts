/**
 * Cache control headers for edge functions
 */

export const CACHE_HEADERS = {
  // Static assets - immutable, long cache
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  
  // Feed JSON - short cache with stale-while-revalidate
  feedJson: {
    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
    'Vary': 'Accept-Encoding',
  },
  
  // Profile data - medium cache
  profile: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    'Vary': 'Accept-Encoding',
  },
  
  // No cache for sensitive/realtime data
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
} as const;

/**
 * Generate ETag for content
 */
export function generateETag(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(36)}"`;
}

/**
 * Check if request has matching ETag
 */
export function checkETag(req: Request, etag: string): boolean {
  const ifNoneMatch = req.headers.get('If-None-Match');
  return ifNoneMatch === etag;
}
