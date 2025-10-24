/**
 * Role: Engagement scorer - Viral score calculation
 * Path: src/apps/yalls-social/libs/utils/engagement-scorer.ts
 * Formula: likes * exp(-freshness/24)
 */

export interface PostMetrics {
  likes: number;
  freshness: number; // hours since posted
}

export function calculateViralScore(metrics: PostMetrics): number {
  const { likes, freshness } = metrics;
  return likes * Math.exp(-freshness / 24);
}

export function rankPosts(posts: Array<{ id: string } & PostMetrics>): Array<{ id: string; score: number }> {
  return posts.map(post => ({
    id: post.id,
    score: calculateViralScore(post),
  })).sort((a, b) => b.score - a.score);
}
