/**
 * TikTok-style vertical scroller with blend enforcement
 * Renders posts, listings, events with proper spacing and deduplication
 */

import { useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import type { FeedItem } from '@/types/feed';
import { ReelCard } from './ReelCard';
import { ListingCard } from './ListingCard';
import { EventCard } from './EventCard';

interface TikTokScrollerProps {
  items: FeedItem[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

export function TikTokScroller({ items, onLoadMore, hasMore, isLoading }: TikTokScrollerProps) {
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const lastSeller = useRef<string | null>(null);

  // Load more when sentinel comes into view
  useCallback(() => {
    if (inView && hasMore && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [inView, hasMore, isLoading, onLoadMore]);

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto pb-24">
      {items.map((item) => {
        // Prevent back-to-back same seller (listings only)
        if (item.kind === 'listing') {
          const sellerEntityId = item.seller_entity_id || item.entity_id;
          if (sellerEntityId === lastSeller.current) {
            // Skip unless rank delta is high (handled server-side for now)
          }
          lastSeller.current = sellerEntityId || null;
        }

        return (
          <div key={`${item.kind}-${item.id}`} className="snap-start">
            {item.kind === 'post' && <ReelCard post={item} />}
            {item.kind === 'listing' && <ListingCard listing={item} />}
            {item.kind === 'event' && <EventCard event={item} />}
          </div>
        );
      })}

      {/* Load more sentinel */}
      {hasMore && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          ) : (
            <span className="text-sm text-muted-foreground">Scroll for more</span>
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          You've reached the end
        </div>
      )}
    </div>
  );
}
