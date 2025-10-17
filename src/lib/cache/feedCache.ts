import { supabase } from '@/integrations/supabase/client';
import { cached, getCacheVersion } from './redis';

/**
 * Cached feed fusion calls with version-based invalidation
 */

export type FeedItem = {
  post_id: string;
  kind: string;
  author_id: string;
  target_entity_id: string;
  created_at: string;
  payload: Record<string, any>;
  next_cursor: number;
};

/**
 * Cached home feed with 30s TTL
 */
export async function getCachedHomeFeed(
  profileId: string,
  lane: string,
  cursor: number | null,
  limit: number = 20
): Promise<FeedItem[]> {
  const version = await getCacheVersion('feed');
  const cacheKey = `feed:home:${version}:${profileId}:${lane}:${cursor || 'init'}:${limit}`;
  
  return cached(cacheKey, 30, async () => {
    const { data, error } = await (supabase as any).rpc('feed_fusion_home', {
      p_profile_id: profileId,
      p_lane: lane,
      p_cursor: cursor,
      p_limit: limit,
    });
    
    if (error) throw error;
    return data || [];
  });
}

/**
 * Cached profile feed with 30s TTL
 */
export async function getCachedProfileFeed(
  profileId: string,
  cursor: number | null,
  limit: number = 20
): Promise<FeedItem[]> {
  const version = await getCacheVersion('feed');
  const cacheKey = `feed:profile:${version}:${profileId}:${cursor || 'init'}:${limit}`;
  
  return cached(cacheKey, 30, async () => {
    const { data, error } = await (supabase as any).rpc('feed_fusion_profile', {
      p_profile_id: profileId,
      p_cursor: cursor,
      p_limit: limit,
    });
    
    if (error) throw error;
    return data || [];
  });
}

/**
 * Cache profile lookups with 5min TTL
 */
export async function getCachedProfile(userId: string) {
  const version = await getCacheVersion('profiles');
  const cacheKey = `profile:${version}:${userId}`;
  
  return cached(cacheKey, 300, async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  });
}
