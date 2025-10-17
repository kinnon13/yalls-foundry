/**
 * Feed Hide Utilities
 * Production-grade feed item suppression with RPC and caching
 */

import { supabase } from '@/integrations/supabase/client';

export type FeedItemType = 'reel' | 'listing' | 'event' | 'post';

export interface HideItemParams {
  itemType: FeedItemType;
  itemId: string;
  reason?: string;
}

export interface HideItemResult {
  success: boolean;
  error?: string;
}

/**
 * Hide a feed item (idempotent)
 * Uses RPC for atomic insert with conflict resolution
 */
export async function hideItem(params: HideItemParams): Promise<HideItemResult> {
  try {
    // Use the existing feed_hide RPC with correct schema (entity/post paradigm)
    const { error } = await (supabase as any).rpc('feed_hide', {
      p_entity_id: params.itemId, // Temp mapping until schema aligns
      p_post_id: params.itemId,
      p_reason: params.reason || null,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('[Feed Hide] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to hide item',
    };
  }
}

/**
 * Get hidden item IDs for filtering
 * Caches in memory for 5 minutes to avoid repeated DB queries
 */
let hiddenItemsCache: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getHiddenItemIds(): Promise<Set<string>> {
  const now = Date.now();
  
  if (hiddenItemsCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return hiddenItemsCache;
  }

  try {
    const { data, error } = await (supabase as any)
      .from('feed_hides')
      .select('post_id');

    if (error) throw error;

    hiddenItemsCache = new Set(data.map((row: any) => row.post_id));
    cacheTimestamp = now;
    
    return hiddenItemsCache;
  } catch (error) {
    console.error('[Feed Hide] Failed to fetch hidden items:', error);
    return new Set();
  }
}

/**
 * Invalidate cache (call after hiding an item)
 */
export function invalidateHiddenItemsCache(): void {
  hiddenItemsCache = null;
  cacheTimestamp = 0;
}

/**
 * Filter out hidden items from a feed
 */
export function filterHiddenItems<T extends { id: string }>(
  items: T[],
  hiddenIds: Set<string>
): T[] {
  return items.filter(item => !hiddenIds.has(item.id));
}
