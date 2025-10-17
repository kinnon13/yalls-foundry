/**
 * TikTok-style Scroller
 * Scroll-snap, ↑/↓ nav, preload ±1, auto-mute/tap-toggle
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { ReelPost } from './ReelPost';
import { ReelListing } from './ReelListing';
import { ReelEvent } from './ReelEvent';
import { useUsageEvent } from '@/hooks/useUsageEvent';

interface FusionItem {
  item_type: 'post' | 'listing' | 'event';
  item_id: string;
  score: number;
  created_at: string;
  payload: any;
}

interface TikTokScrollerProps {
  items: FusionItem[];
  isLoading: boolean;
  lane: string;
}

export function TikTokScroller({ items, isLoading, lane }: TikTokScrollerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const logUsageEvent = useUsageEvent();

  // Log impressions
  useEffect(() => {
    if (items[currentIndex]) {
      const item = items[currentIndex];
      logUsageEvent('impression', item.item_type, item.item_id, { lane });
    }
  }, [currentIndex, items]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && currentIndex < items.length - 1) {
        scrollToIndex(currentIndex + 1);
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        scrollToIndex(currentIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, items.length]);

  const scrollToIndex = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.children[index] as HTMLElement;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentIndex(index);
    }
  };

  // Intersection observer for auto-index tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const index = Array.from(container.children).indexOf(entry.target);
            if (index !== -1) setCurrentIndex(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse-subtle text-muted-foreground">Loading feed...</div>
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
        className="snap-y snap-mandatory overflow-y-scroll h-[calc(100vh-8rem)] scroll-smooth"
        style={{ scrollSnapType: 'y mandatory' }}
      >
        {items.map((item, index) => (
          <div
            key={`${item.item_type}-${item.item_id}`}
            className="snap-start snap-always h-[calc(100vh-8rem)] flex items-center justify-center"
          >
            {item.item_type === 'post' && (
              <ReelPost data={item.payload} itemId={item.item_id} muted={muted} onToggleMute={() => setMuted(!muted)} />
            )}
            {item.item_type === 'listing' && (
              <ReelListing data={item.payload} itemId={item.item_id} />
            )}
            {item.item_type === 'event' && (
              <ReelEvent data={item.payload} itemId={item.item_id} />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <div className="fixed right-8 bottom-1/2 translate-y-1/2 flex flex-col gap-4 z-30">
        <button
          onClick={() => scrollToIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronUp size={20} />
        </button>
        <button
          onClick={() => scrollToIndex(Math.min(items.length - 1, currentIndex + 1))}
          disabled={currentIndex === items.length - 1}
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
      </div>
    </div>
  );
}
