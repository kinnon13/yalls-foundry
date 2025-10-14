/**
 * Cache Tag Utilities
 * 
 * Helpers for generating cache tags and invalidating tagged entries.
 * 
 * Usage:
 *   import { cacheTags, invalidateTag } from '@/lib/cache/tags';
 *   const tags = cacheTags.profile(userId);
 *   await invalidateTag('profile:123');
 */

import { memCache } from './memory';

/**
 * Generate cache tags for different resource types
 */
export const cacheTags = {
  profile: (userId: string) => [`profile:${userId}`],
  business: (businessId: string) => [`business:${businessId}`],
  event: (eventId: string) => [`event:${eventId}`],
  eventsByBusiness: (businessId: string) => [`events:business:${businessId}`],
  userBusinesses: (userId: string) => [`businesses:user:${userId}`],
  userEvents: (userId: string) => [`events:user:${userId}`],
};

/**
 * Invalidate all cache entries with a specific tag
 */
export async function invalidateTag(tag: string): Promise<void> {
  await memCache.invalidateByTag(tag);
  // TODO: Also invalidate L2 cache (Upstash/Supabase) when implemented
}

/**
 * Invalidate multiple tags at once
 */
export async function invalidateTags(tags: string[]): Promise<void> {
  await Promise.all(tags.map(tag => invalidateTag(tag)));
}