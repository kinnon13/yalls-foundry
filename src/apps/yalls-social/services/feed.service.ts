/**
 * Role: Social feed service - Sharded queries and viral scoring
 * Path: src/apps/yalls-social/services/feed.service.ts
 */

import { calculateViralScore } from '../libs/utils/engagement-scorer';

export interface Post {
  id: string;
  content: string;
  author: string;
  likes: number;
  freshness: number;
  viralScore?: number;
}

/**
 * Fetch user feed with sharding
 */
export async function fetchFeed(userId: string, page: number = 0): Promise<Post[]> {
  // Stub: Shard based on userId % 64
  const shard = parseInt(userId.slice(-2), 16) % 64;
  console.log(`[Feed Service] Fetching page ${page} from shard ${shard}`);
  
  // Stub data
  const posts: Post[] = [
    { id: '1', content: 'Viral post 1', author: '@creator', likes: 1500, freshness: 2 },
    { id: '2', content: 'Trending now', author: '@star', likes: 2300, freshness: 1 },
    { id: '3', content: 'New content', author: '@guru', likes: 890, freshness: 5 },
  ];
  
  return posts.map(post => ({
    ...post,
    viralScore: calculateViralScore({ likes: post.likes, freshness: post.freshness }),
  }));
}

/**
 * Like a post
 */
export async function likePost(postId: string): Promise<void> {
  console.log('[Feed Service] Liking post:', postId);
}
