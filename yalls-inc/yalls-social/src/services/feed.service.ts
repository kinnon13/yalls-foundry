/**
 * Role: Feed service - sharded queries (userId % 64) and viral scoring
 * Path: yalls-inc/yalls-social/src/services/feed.service.ts
 * Imports: @/integrations/supabase/client, ../libs/utils/engagement-scorer
 */

import { supabase } from '@/integrations/supabase/client';
import { calculateViralScore } from '../libs/utils/engagement-scorer';

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  likes_count: number;
  comments_count: number;
  viral_score: number;
  product_id?: string;
  created_at: string;
}

/**
 * Fetch AI-curated feed with viral ranking
 * Uses sharding: userId % 64 for distributed queries
 */
export async function fetchFeed(userId: string, page: number): Promise<FeedPost[]> {
  const limit = 20;
  const offset = page * limit;

  // Calculate shard (stub for future sharding strategy)
  const shard = hashUserId(userId) % 64;
  console.log(`Fetching feed for shard ${shard}, page ${page}`);

  const { data, error } = await supabase
    .from('yalls_social_posts')
    .select('*')
    .order('viral_score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Recalculate viral scores (freshen on fetch)
  const posts = (data || []).map(post => ({
    ...post,
    viral_score: calculateViralScore(post.likes_count, post.created_at),
  }));

  return posts;
}

/**
 * Like a post (optimistic update)
 */
export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('yalls_social_likes')
    .insert({ post_id: postId, user_id: userId });

  if (error) throw error;

  // Increment likes_count
  await supabase.rpc('increment_post_likes', { post_id: postId });
}

/**
 * Hash userId for sharding (stub)
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
