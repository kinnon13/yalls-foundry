/**
 * ProfileDeck - Main canvas with gesture-based navigation
 * 
 * Left/Right: Switch profile
 * Up/Down: Scroll feed
 * Gesture arbitration: horizontal swipe when abs(dx) > abs(dy) * 1.2
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BubbleItem } from '@/routes/social';
import type { FeedItem } from '@/types/feed';
import { TikTokScroller } from '@/components/reels/TikTokScroller';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRocker } from '@/lib/ai/rocker';

interface ProfileDeckProps {
  currentId: string;
  allBubbles: BubbleItem[];
  onSwitch: (id: string) => void;
}

export function ProfileDeck({ currentId, allBubbles, onSwitch }: ProfileDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { log } = useRocker();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  const currentIndex = allBubbles.findIndex(b => b.id === currentId);
  const currentBubble = allBubbles[currentIndex];

  // Fetch feed for current profile
  const { data: feedItems, isLoading } = useQuery({
    queryKey: ['profile-feed', currentId],
    queryFn: async () => {
      // Query posts targeting this entity
      const { data, error } = await supabase
        .from('post_targets')
        .select(`
          id,
          post_id,
          target_entity_id,
          created_at,
          posts!post_targets_post_id_fkey (
            id,
            body,
            media,
            created_at,
            author_user_id
          )
        `)
        .eq('target_entity_id', currentId)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Feed fetch error:', error);
        return [];
      }

      // Map to FeedItem format
      return (data || [])
        .filter((pt): pt is typeof pt & { posts: NonNullable<typeof pt.posts> } => !!pt.posts)
        .map(pt => ({
          id: pt.posts.id,
          kind: 'post' as const,
          entity_id: currentId,
          created_at: pt.posts.created_at,
          score: 1.0,
          body: pt.posts.body || '',
          media: (Array.isArray(pt.posts.media) ? pt.posts.media : []) as any[],
          author_user_id: pt.posts.author_user_id || undefined,
        }));
    },
    enabled: !!currentId
  });

  // Gesture handling for horizontal swipe
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart) return;

      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;

      // Gesture arbitration: horizontal only if abs(dx) > abs(dy) * 1.2
      if (Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > 80) {
        const fromId = currentId;
        
        if (dx > 0 && currentIndex > 0) {
          // Swipe right -> previous
          const prevId = allBubbles[currentIndex - 1].id;
          onSwitch(prevId);
          log('bubble_switch', { fromId, toId: prevId, method: 'swipe' });
        } else if (dx < 0 && currentIndex < allBubbles.length - 1) {
          // Swipe left -> next
          const nextId = allBubbles[currentIndex + 1].id;
          onSwitch(nextId);
          log('bubble_switch', { fromId, toId: nextId, method: 'swipe' });
        }
      }

      setTouchStart(null);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [touchStart, currentId, currentIndex, allBubbles, onSwitch, log]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const fromId = currentId;
      
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        const prevId = allBubbles[currentIndex - 1].id;
        onSwitch(prevId);
        log('bubble_switch', { fromId, toId: prevId, method: 'arrow' });
      } else if (e.key === 'ArrowRight' && currentIndex < allBubbles.length - 1) {
        const nextId = allBubbles[currentIndex + 1].id;
        onSwitch(nextId);
        log('bubble_switch', { fromId, toId: nextId, method: 'arrow' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentId, currentIndex, allBubbles, onSwitch, log]);

  const handlePrevProfile = () => {
    if (currentIndex > 0) {
      const fromId = currentId;
      const prevId = allBubbles[currentIndex - 1].id;
      onSwitch(prevId);
      log('bubble_switch', { fromId, toId: prevId, method: 'click' });
    }
  };

  const handleNextProfile = () => {
    if (currentIndex < allBubbles.length - 1) {
      const fromId = currentId;
      const nextId = allBubbles[currentIndex + 1].id;
      onSwitch(nextId);
      log('bubble_switch', { fromId, toId: nextId, method: 'click' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Profile Header */}
      {currentBubble && (
        <div className="px-6 py-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <h2 className="text-2xl font-bold">{currentBubble.display_name}</h2>
          {currentBubble.handle && (
            <p className="text-sm text-muted-foreground">@{currentBubble.handle}</p>
          )}
        </div>
      )}

      {/* Feed Scroller */}
      {feedItems && feedItems.length > 0 ? (
        <TikTokScroller
          items={feedItems}
          isLoading={false}
          lane={`profile:${currentId}`}
        />
      ) : (
        <div className="flex items-center justify-center h-[calc(100vh-16rem)]">
          <div className="text-center p-8">
            <p className="text-lg text-muted-foreground mb-2">No activity yet</p>
            <p className="text-sm text-muted-foreground">Check back soon!</p>
          </div>
        </div>
      )}

      {/* Navigation arrows (fixed on desktop) */}
      <div className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 z-30">
        <button
          onClick={handlePrevProfile}
          disabled={currentIndex === 0}
          aria-label="Previous profile"
          className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={24} />
        </button>
      </div>
      <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 z-30">
        <button
          onClick={handleNextProfile}
          disabled={currentIndex === allBubbles.length - 1}
          aria-label="Next profile"
          className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
