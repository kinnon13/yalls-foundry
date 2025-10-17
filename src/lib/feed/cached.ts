/**
 * Cached Feed Fetcher
 * 60s TTL per user/lane to reduce DB load
 */

import { supabase } from '@/integrations/supabase/client';
import { rget, rset } from '@/lib/redis/client';

export interface FeedItem {
  kind: 'post' | 'listing' | 'event';
  id: string;
  score: number;
  created_at: string;
  entity_id: string;
  [key: string]: any;
}

export async function getHomeFeedCached(
  userId: string | null,
  lane: 'personal' | 'combined'
): Promise<FeedItem[]> {
  const key = `feed:home:${userId ?? 'anon'}:${lane}`;
  const cached = await rget<FeedItem[]>(key);
  if (cached) return cached;

  const { data, error } = await (supabase.rpc as any)('feed_fusion_home', {
    p_user_id: userId,
    p_mode: lane
  });
  
  if (error) throw error;

  const items: FeedItem[] = (data || []).map((row: any) => ({
    kind: row.item_type,
    id: row.item_id,
    score: row.rank,
    created_at: row.created_at,
    entity_id: row.entity_id,
    ...row.payload
  }));

  // Cache for 60s
  await rset(key, items, 60);
  return items;
}

export async function getProfileFeedCached(
  entityId: string,
  mode: 'this' | 'all'
): Promise<FeedItem[]> {
  const key = `feed:profile:${entityId}:${mode}`;
  const cached = await rget<FeedItem[]>(key);
  if (cached) return cached;

  const { data, error } = await (supabase.rpc as any)('feed_fusion_profile', {
    p_entity_id: entityId,
    p_mode: mode
  });
  
  if (error) throw error;

  const items: FeedItem[] = (data || []).map((row: any) => ({
    kind: row.item_type,
    id: row.item_id,
    score: row.rank,
    created_at: row.created_at,
    entity_id: row.entity_id,
    ...row.payload
  }));

  await rset(key, items, 120);
  return items;
}
