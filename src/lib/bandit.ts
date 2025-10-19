/**
 * Epsilon-Greedy Bandit for Exploration/Exploitation
 * 
 * Use this to rank candidates with controlled exploration:
 * - Most of the time (1-ε), rank by predicted score (exploit)
 * - Sometimes (ε), shuffle to explore new options
 */

export interface Candidate {
  id: string;
  score: number;
}

export interface RankResult {
  ranked: Candidate[];
  explored: boolean;
  epsilon: number;
}

/**
 * Rank candidates with epsilon-greedy exploration
 * @param items - Candidates with scores
 * @param epsilon - Exploration probability (default 0.08 = 8%)
 * @returns Ranked items with exploration flag
 */
export function rankWithEpsilonGreedy(
  items: Candidate[],
  epsilon = 0.08
): RankResult {
  if (items.length <= 1) {
    return { ranked: items, explored: false, epsilon };
  }

  const rnd = Math.random();

  if (rnd < epsilon) {
    // EXPLORE: Shuffle to discover new patterns
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return { ranked: shuffled, explored: true, epsilon };
  }

  // EXPLOIT: Rank by predicted score
  const sorted = [...items].sort((a, b) => b.score - a.score);
  return { ranked: sorted, explored: false, epsilon };
}

/**
 * Calculate normalized reward (0..1) from various signals
 * @param signals - Raw engagement signals
 * @returns Normalized reward score
 */
export function calculateReward(signals: {
  watched?: boolean;
  watchTimeMs?: number;
  liked?: boolean;
  commented?: boolean;
  followed?: boolean;
  purchased?: boolean;
}): number {
  let reward = 0;

  // Watch completion (weighted heavily)
  if (signals.watched) {
    const watchSeconds = (signals.watchTimeMs || 0) / 1000;
    // Normalize: 5s+ = 0.3, 10s+ = 0.5, 30s+ = 0.7
    if (watchSeconds >= 30) reward += 0.7;
    else if (watchSeconds >= 10) reward += 0.5;
    else if (watchSeconds >= 5) reward += 0.3;
  }

  // Engagement actions
  if (signals.liked) reward += 0.15;
  if (signals.commented) reward += 0.2;
  if (signals.followed) reward += 0.25;
  if (signals.purchased) reward += 1.0; // Max reward

  return Math.min(reward, 1.0);
}
