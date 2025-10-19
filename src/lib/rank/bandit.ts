/**
 * Bandit Exploration & Ranking
 * Production-grade ε-greedy with surface-specific tuning
 */

export type Candidate = { id: string; score: number };
export type Surface = 'feed' | 'pdp' | 'market';
export type Device = 'mobile' | 'desktop';

/**
 * Get epsilon for surface and device
 */
export function epsilonForSurface(surface: Surface, device: Device): number {
  if (surface === 'feed') return device === 'mobile' ? 0.12 : 0.08;
  if (surface === 'market') return 0.10;
  return 0.06; // pdp or other
}

/**
 * Epsilon-greedy ranking with exploration
 */
export function rankWithEpsilonGreedy<T extends { score: number }>(
  items: T[],
  epsilon: number
): { ranked: T[]; explored: boolean; epsilon: number } {
  if (items.length <= 1) return { ranked: items, explored: false, epsilon };
  
  // Explore: Fisher-Yates shuffle
  if (Math.random() < epsilon) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { ranked: shuffled, explored: true, epsilon };
  }
  
  // Exploit: by score
  return { ranked: [...items].sort((a, b) => b.score - a.score), explored: false, epsilon };
}

/**
 * Calculate reward from user outcome
 */
export function calculateReward(outcome: {
  watched?: boolean;
  watchTimeMs?: number;
  liked?: boolean;
  commented?: boolean;
  shared?: boolean;
  purchased?: boolean;
}): number {
  let reward = 0;
  
  if (outcome.liked) reward += 0.3;
  if (outcome.commented) reward += 0.2;
  if (outcome.shared) reward += 0.5;
  if (outcome.purchased) reward += 1.0;
  
  if (outcome.watched && outcome.watchTimeMs) {
    // Normalize watch time: 5s+ = full watch reward
    const watchReward = Math.min(outcome.watchTimeMs / 5000, 1.0) * 0.4;
    reward += watchReward;
  }
  
  return Math.min(reward, 1.0);
}

/**
 * Fallback candidates when primary suggestions are empty
 */
export function fallbackCandidates<T>(ctx: {
  topDomain?: string;
  popular: T[];
  recent: T[];
  global: T[];
}): T[] {
  const out: T[] = [];
  out.push(...ctx.popular.slice(0, 10));
  if (out.length < 10) out.push(...ctx.recent.slice(0, 10 - out.length));
  if (out.length < 10) out.push(...ctx.global.slice(0, 10 - out.length));
  return out;
}
