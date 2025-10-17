/**
 * TikTok-style Scroller with Dedupe + Dwell Tracking + A11y
 * Scroll-snap, ↑/↓ nav, impression dedupe, dwell timers
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { ReelPost } from './ReelPost';
import { ReelListing } from './ReelListing';
import { ReelEvent } from './ReelEvent';
import { useUsageEvent } from '@/hooks/useUsageEvent';
import type { FeedItem } from '@/types/feed';

interface TikTokScrollerProps {
  items: FeedItem[];
  isLoading: boolean;
  lane: string;
  onLoadMore?: () => void;
  hasNextPage?: boolean;
}

export function TikTokScroller({ items, isLoading, lane, onLoadMore, hasNextPage }: TikTokScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const seenRef = useRef<Set<string>>(new Set());
  const dwellStopRef = useRef<(() => void) | null>(null);
  const logUsageEvent = useUsageEvent();

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.children[index] as HTMLElement;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentIndex(index);
    }
  }, []);

  // Log impression (dedupe) + start dwell timer
  useEffect(() => {
    const item = items[currentIndex];
    if (!item) return;

    const key = `${item.kind}:${item.id}`;

    // Log impression once
    if (!seenRef.current.has(key)) {
      seenRef.current.add(key);
      logUsageEvent('impression', item.kind, item.id, { lane });
    }

    // Stop previous dwell timer
    if (dwellStopRef.current) dwellStopRef.current();

    // Start new dwell timer (3s threshold)
    const start = Date.now();
    dwellStopRef.current = () => {
      const ms = Date.now() - start;
      if (ms >= 3000) {
        logUsageEvent('dwell', item.kind, item.id, { ms, lane });
      }
    };

    return () => {
      if (dwellStopRef.current) dwellStopRef.current();
    };
  }, [currentIndex, items, lane, logUsageEvent]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < items.length - 1) {
        e.preventDefault();
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        scrollToIndex(currentIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items.length, scrollToIndex]);

  // Intersection observer for auto-index tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = Array.from(container.children).indexOf(entry.target);
            if (index !== -1 && index !== currentIndex) {
              setCurrentIndex(index);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [items, currentIndex]);

  // Auto-load more when near end
  useEffect(() => {
    if (currentIndex >= items.length - 3 && hasNextPage && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [currentIndex, items.length, hasNextPage, isLoading, onLoadMore]);

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen text-center p-8">
        <div>
          <p className="text-lg text-muted-foreground mb-2">No content yet</p>
          <p className="text-sm text-muted-foreground">Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        role="feed"
        aria-label="Content feed"
        className="snap-y snap-mandatory overflow-y-scroll h-[calc(100vh-8rem)] scroll-smooth"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {items.map((item, index) => (
          <div
            key={`${item.kind}-${item.id}-${index}`}
            role="article"
            className="snap-start snap-always h-[calc(100vh-8rem)] flex items-center justify-center"
          >
            {item.kind === 'post' && (
              <ReelPost
                data={item as any}
                itemId={item.id}
                muted={muted}
                onToggleMute={() => setMuted(!muted)}
                isActive={currentIndex === index}
              />
            )}
            {item.kind === 'listing' && (
              <ReelListing data={item as any} itemId={item.id} />
            )}
            {item.kind === 'event' && (
              <ReelEvent data={item as any} itemId={item.id} />
            )}
          </div>
        ))}
        {isLoading && (
          <div className="snap-start h-[calc(100vh-8rem)] flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Navigation Arrows */}
      <div className="fixed right-8 bottom-1/2 translate-y-1/2 flex flex-col gap-4 z-30">
        <button
          onClick={() => scrollToIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          aria-label="Previous item"
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp size={20} />
        </button>
        <button
          onClick={() => scrollToIndex(Math.min(items.length - 1, currentIndex + 1))}
          disabled={currentIndex === items.length - 1 && !hasNextPage}
          aria-label="Next item"
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-1 z-30">
        {items.slice(0, 10).map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-all ${
              i === currentIndex ? 'bg-white w-4' : 'bg-white/30'
            }`}
          />
        ))}
        {hasNextPage && (
          <div className="w-1 h-1 rounded-full bg-white/30 animate-pulse" />
        )}
      </div>
    </div>
  );
}
