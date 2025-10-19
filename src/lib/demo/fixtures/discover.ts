/**
 * Demo Fixtures: Discover (For You / Trending / Latest)
 */

import type { FeedItem } from '@/types/feed';
import { generatePersonName, generateImage, generateCounts, generateTimestamp, createSeededRandom } from '../seed';

export function generateDiscoverForYou(count: number = 30): FeedItem[] {
  const items: FeedItem[] = [];
  const rng = createSeededRandom('discover-for-you');
  
  for (let i = 0; i < count; i++) {
    const seed = `discover-fy-${i}`;
    const kind = rng.next() < 0.5 ? 'post' : 'listing';
    const author = generatePersonName(`author-${seed}`);
    const counts = generateCounts(seed);
    
    if (kind === 'post') {
      items.push({
        id: `post-${seed}`,
        kind: 'post',
        entity_id: `entity-${seed}`,
        score: rng.next(),
        created_at: generateTimestamp(seed),
        body: `Discover post - ${author.full}`,
        media: [{ type: 'image', url: generateImage(seed) }],
        author_user_id: `user-${seed}`,
      });
    } else {
      items.push({
        id: `listing-${seed}`,
        kind: 'listing',
        entity_id: `entity-${seed}`,
        score: rng.next(),
        created_at: generateTimestamp(seed),
        title: `Discover Listing - ${author.full}`,
        price_cents: rng.int(50, 500) * 100,
        media: [{ type: 'image', url: generateImage(seed) }],
        seller_entity_id: `user-${seed}`,
      });
    }
  }
  
  return items;
}

export function generateDiscoverTrending(count: number = 30): FeedItem[] {
  const items = generateDiscoverForYou(count);
  // Boost score for trending
  return items.map(item => ({
    ...item,
    score: item.score * 3,
  }));
}

export function generateDiscoverLatest(count: number = 30): FeedItem[] {
  const items = generateDiscoverForYou(count);
  // Sort by created_at
  return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
