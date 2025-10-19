/**
 * Demo Fixtures: Marketplace Listings
 */

import { generatePersonName, generateImage, generateCounts, generateTimestamp, createSeededRandom } from '../seed';

export interface DemoListing {
  id: string;
  title: string;
  price: number;
  stock: number;
  seller: {
    id: string;
    name: string;
    avatar: string;
  };
  media: Array<{ type: 'image'; url: string }>;
  created_at: string;
  stats: {
    views: number;
    saves: number;
  };
}

export function generateMarketplaceListings(count: number = 12): DemoListing[] {
  const items: DemoListing[] = [];
  const rng = createSeededRandom('marketplace');
  
  for (let i = 0; i < count; i++) {
    const seed = `marketplace-${i}`;
    const seller = generatePersonName(`seller-${seed}`);
    const counts = generateCounts(seed);
    
    items.push({
      id: `listing-${seed}`,
      title: `Demo Listing #${i + 1}`,
      price: rng.int(25, 750) * 100,
      stock: rng.int(1, 30),
      seller: {
        id: `seller-${seed}`,
        name: seller.full,
        avatar: generateImage(`avatar-${seed}`, 200, 200),
      },
      media: [
        { type: 'image', url: generateImage(`${seed}-0`) },
        { type: 'image', url: generateImage(`${seed}-1`) },
        { type: 'image', url: generateImage(`${seed}-2`) },
      ],
      created_at: generateTimestamp(seed),
      stats: {
        views: counts.views,
        saves: rng.int(10, 200),
      },
    });
  }
  
  return items;
}
