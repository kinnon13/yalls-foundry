/**
 * Role: Viral engagement scoring - likes × exp(-freshness/24h)
 * Path: yalls-inc/yalls-social/libs/utils/engagement-scorer.ts
 */

/**
 * Calculate viral score based on engagement and freshness
 * Formula: likes × e^(-hours_old / 24)
 * 
 * Examples:
 * - 100 likes, 1h old: 100 × e^(-1/24) ≈ 95.9
 * - 100 likes, 12h old: 100 × e^(-12/24) ≈ 60.7
 * - 100 likes, 24h old: 100 × e^(-24/24) ≈ 36.8
 */
export function calculateViralScore(likesCount: number, createdAt: string): number {
  const now = new Date();
  const postDate = new Date(createdAt);
  const hoursOld = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);

  // Viral decay: e^(-hours/24)
  const freshnessFactor = Math.exp(-hoursOld / 24);
  
  return likesCount * freshnessFactor;
}

/**
 * Rank posts by viral score
 */
export function rankByViralScore(posts: Array<{ likes_count: number; created_at: string }>): number[] {
  return posts
    .map((post, index) => ({
      index,
      score: calculateViralScore(post.likes_count, post.created_at),
    }))
    .sort((a, b) => b.score - a.score)
    .map(item => item.index);
}

/**
 * Get suggested boost multiplier for paid promotion
 * Stub: Future paid viral boost feature
 */
export function getBoostMultiplier(currentScore: number, targetScore: number): number {
  return targetScore / currentScore;
}
