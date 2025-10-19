/**
 * Demo Fixtures: Home Feed (For You / Following / Shop)
 */

import type { FeedItem } from '@/types/feed';
import { generatePersonName, generateImage, generateVideo, generateCounts, generateTimestamp, createSeededRandom } from '../seed';

export function generateHomeForYou(userId: string = 'guest', count: number = 20): FeedItem[] {
  const items: FeedItem[] = [];
  const rng = createSeededRandom(`${userId}-for-you`);
  
  for (let i = 0; i < count; i++) {
    const seed = `${userId}-fy-${i}`;
    const kind = rng.next() < 0.6 ? 'post' : (rng.next() < 0.7 ? 'listing' : 'event');
    const author = generatePersonName(`author-${seed}`);
    const counts = generateCounts(seed);
    
    if (kind === 'post') {
      items.push({
        id: `post-${seed}`,
        kind: 'post',
        entity_id: `entity-${seed}`,
        score: rng.next(),
        created_at: generateTimestamp(seed),
        body: `Demo post from ${author.full} - This is mock content for testing the feed scroller.`,
        media: [
          {
            type: rng.next() < 0.7 ? 'image' : 'video',
            url: rng.next() < 0.7 ? generateImage(seed) : generateVideo(seed),
          },
        ],
        author_user_id: `user-${seed}`,
        labels: [],
      });
    } else if (kind === 'listing') {
      items.push({
        id: `listing-${seed}`,
        kind: 'listing',
        entity_id: `entity-${seed}`,
        score: rng.next(),
        created_at: generateTimestamp(seed),
        title: `Demo Listing #${i + 1}`,
        price_cents: rng.int(50, 500) * 100,
        stock_quantity: rng.int(1, 20),
        media: [
          { type: 'image', url: generateImage(`${seed}-0`) },
          { type: 'image', url: generateImage(`${seed}-1`) },
        ],
        seller_entity_id: `seller-${seed}`,
      });
    } else {
      items.push({
        id: `event-${seed}`,
        kind: 'event',
        entity_id: `entity-${seed}`,
        score: rng.next(),
        created_at: generateTimestamp(seed),
        title: `Demo Event #${i + 1}`,
        starts_at: new Date(Date.now() + rng.int(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
        location: { name: 'Demo Arena' },
        host_entity_id: `org-${seed}`,
      });
    }
  }
  
  return items;
}

export function generateHomeFollowing(userId: string = 'guest', count: number = 20): FeedItem[] {
  const items: FeedItem[] = [];
  const rng = createSeededRandom(`${userId}-following`);
  
  for (let i = 0; i < count; i++) {
    const seed = `${userId}-fl-${i}`;
    const kind = rng.next() < 0.8 ? 'post' : (rng.next() < 0.75 ? 'event' : 'listing');
    const author = generatePersonName(`author-${seed}`);
    const counts = generateCounts(seed);
    
    if (kind === 'post') {
      items.push({
        id: `post-${seed}`,
        kind: 'post',
        entity_id: `entity-${seed}`,
        score: rng.next(),
        created_at: generateTimestamp(seed),
        body: `Following feed post - ${author.full}`,
        media: [
          {
            type: rng.next() < 0.7 ? 'image' : 'video',
            url: rng.next() < 0.7 ? generateImage(seed) : generateVideo(seed),
          },
        ],
        author_user_id: `user-${seed}`,
        labels: [],
      });
    }
  }
  
  return items;
}

export function generateHomeShop(userId: string = 'guest', count: number = 20): FeedItem[] {
  const items: FeedItem[] = [];
  const rng = createSeededRandom(`${userId}-shop`);
  
  for (let i = 0; i < count; i++) {
    const seed = `${userId}-shop-${i}`;
    const seller = generatePersonName(`seller-${seed}`);
    const counts = generateCounts(seed);
    
    items.push({
      id: `listing-${seed}`,
      kind: 'listing',
      entity_id: `entity-${seed}`,
      score: rng.next(),
      created_at: generateTimestamp(seed),
      title: `Shop Item #${i + 1}`,
      price_cents: rng.int(20, 800) * 100,
      stock_quantity: rng.int(1, 50),
      media: [
        { type: 'image', url: generateImage(`${seed}-0`) },
        { type: 'image', url: generateImage(`${seed}-1`) },
        { type: 'image', url: generateImage(`${seed}-2`) },
      ],
      seller_entity_id: `seller-${seed}`,
    });
  }
  
  return items;
}
