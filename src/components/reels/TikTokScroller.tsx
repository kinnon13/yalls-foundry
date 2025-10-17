// TikTokScroller - Vertical snap scroll with keyboard nav and preload (PR5)
import { useEffect, useRef, useState } from 'react';
import { FeedItem } from '@/types/feed';
import { ReelPost } from './ReelPost';
import { ReelListing } from './ReelListing';
import { ReelEvent } from './ReelEvent';
import { Loader2 } from 'lucide-react';
import { logUsageEvent, createDwellTimer } from '@/lib/telemetry/usageEvents';

interface TikTokScrollerProps {
  items: FeedItem[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onItemView?: (item: FeedItem) => void;
}

export function TikTokScroller({ 
  items, 
  isLoading, 
  hasMore, 
  onLoadMore,
  onItemView 
}: TikTokScrollerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const impressedItemsRef = useRef<Set<string>>(new Set());
  const dwellCleanupRef = useRef<(() => void) | null>(null);

  // Set up intersection observer for tracking visible item
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setCurrentIndex(index);
            
            // Log view event
            const item = items[index];
            if (item && onItemView) {
              onItemView(item);
            }

            // Log impression (first view only)
            const itemKey = `${item.kind}-${item.id}`;
            if (item && !impressedItemsRef.current.has(itemKey)) {
              impressedItemsRef.current.add(itemKey);
              logUsageEvent({
                eventType: 'impression',
                itemType: item.kind,
                itemId: item.id
              });
            }

            // Start dwell timer
            if (dwellCleanupRef.current) {
              dwellCleanupRef.current();
            }
            if (item) {
              dwellCleanupRef.current = createDwellTimer(item);
            }

            // Load more when near end
            if (index >= items.length - 2 && hasMore && onLoadMore && !isLoading) {
              onLoadMore();
            }
          } else {
            // Item scrolled out of view - log dwell if active
            if (dwellCleanupRef.current) {
              dwellCleanupRef.current();
              dwellCleanupRef.current = null;
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe all items
    const itemElements = containerRef.current.querySelectorAll('[data-index]');
    itemElements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items, hasMore, isLoading, onLoadMore, onItemView]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(Math.min(currentIndex + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(Math.max(currentIndex - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items.length]);

  const scrollToIndex = (index: number) => {
    const element = containerRef.current?.querySelector(`[data-index="${index}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Preload adjacent media (±1)
  useEffect(() => {
    const preloadIndexes = [
      Math.max(0, currentIndex - 1),
      currentIndex,
      Math.min(items.length - 1, currentIndex + 1)
    ];

    preloadIndexes.forEach((idx) => {
      const item = items[idx];
      if (!item) return;

      if (item.kind === 'post' && item.media) {
        item.media.forEach((m) => {
          if (m.type === 'image') {
            const img = new Image();
            img.src = m.url;
          }
        });
      } else if (item.kind === 'listing' && item.media) {
        item.media.forEach((m) => {
          if (m.type === 'image') {
            const img = new Image();
            img.src = m.url;
          }
        });
      }
    });
  }, [currentIndex, items]);

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-4rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .snap-y::-webkit-scrollbar { display: none; }
      `}</style>

      {items.map((item, index) => (
        <div
          key={`${item.kind}-${item.id}`}
          data-index={index}
          className="snap-start h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-2"
        >
          {item.kind === 'post' && <ReelPost reel={item} />}
          {item.kind === 'listing' && <ReelListing reel={item} />}
          {item.kind === 'event' && <ReelEvent reel={item} />}
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="snap-start h-[calc(100vh-4rem)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* End message */}
      {!hasMore && items.length > 0 && (
        <div className="snap-start h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-muted-foreground">You've reached the end</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="snap-start h-[calc(100vh-4rem)] flex items-center justify-center">
          <p className="text-muted-foreground">No items to display</p>
        </div>
      )}
    </div>
  );
}
