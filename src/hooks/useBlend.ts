import type { FeedItem } from '@/types/feed';

export function blendWithCaps(
  items: FeedItem[],
  mode: 'personal' | 'combined'
): FeedItem[] {
  const maxListingRatio = mode === 'personal' ? 1 / 3 : 1 / 2;
  const out: FeedItem[] = [];
  let listings = 0;
  let prevSeller: string | null = null;

  for (const it of items) {
    if (it.kind === 'listing') {
      const currRatio = out.length === 0 ? 1 : (listings + 1) / (out.length + 1);
      const thisSeller = it.seller_entity_id || it.entity_id;
      
      // Skip if ratio exceeded
      if (currRatio > maxListingRatio) continue;
      
      // Skip if same seller back-to-back
      if (thisSeller && prevSeller === thisSeller) continue;
      
      listings++;
      prevSeller = thisSeller ?? null;
    } else {
      prevSeller = null;
    }
    out.push(it);
  }
  
  return out;
}
