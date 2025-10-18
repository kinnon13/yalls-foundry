/**
 * TikTok-style Vertical Feed with Infinite Scroll
 * Full-screen cards that snap into view
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  body: string;
  media?: any;
  created_at: string;
  author_user_id: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
  entities?: {
    display_name: string;
    handle?: string;
  };
}

export function TikTokFeed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(0);

  // Fetch posts with pagination
  const { data: posts, isLoading } = useQuery({
    queryKey: ['tiktok-feed', page],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const pageSize = 10;
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Query posts directly (not through post_targets)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          body,
          media,
          created_at,
          author_user_id,
          profiles (display_name, avatar_url),
          entities (display_name, handle)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return data || [];
    }
  });

  // Snap scroll behavior
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const windowHeight = window.innerHeight;
      const index = Math.round(scrollTop / windowHeight);
      setCurrentIndex(index);

      // Load next page when near the end
      if (posts && index >= posts.length - 3) {
        setPage(p => p + 1);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [posts]);

  // Snap to nearest card
  const snapToCard = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    
    container.scrollTo({
      top: index * window.innerHeight,
      behavior: 'smooth'
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' && posts) {
        e.preventDefault();
        const next = Math.min(currentIndex + 1, posts.length - 1);
        snapToCard(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = Math.max(currentIndex - 1, 0);
        snapToCard(prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, posts, snapToCard]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-white">Loading feed...</div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/20 to-background p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No posts yet</h2>
        <p className="text-muted-foreground max-w-sm">
          Be the first to share something! Start creating content and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black"
      style={{ scrollSnapType: 'y mandatory' }}
    >
      {posts.map((post: Post, idx: number) => (
        <div
          key={post.id}
          className="h-screen w-full snap-start snap-always relative flex items-center justify-center"
        >
          {/* Background media */}
          {post.media?.url && (
            <img
              src={post.media.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Content overlay */}
          <div className="relative z-10 w-full h-full flex flex-col justify-end p-6 pb-24">
            {/* Author info */}
            <div className="flex items-center gap-3 mb-4">
              {post.profiles?.avatar_url ? (
                <img
                  src={post.profiles.avatar_url}
                  alt={post.profiles.display_name}
                  className="w-12 h-12 rounded-full border-2 border-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                  {post.profiles?.display_name?.[0] || '?'}
                </div>
              )}
              <div>
                <div className="font-semibold text-white">
                  {post.profiles?.display_name || 'Anonymous'}
                </div>
                {post.entities?.handle && (
                  <div className="text-sm text-white/70">@{post.entities.handle}</div>
                )}
              </div>
              <Button
                size="sm"
                className="ml-auto bg-primary hover:bg-primary/90"
              >
                Follow
              </Button>
            </div>

            {/* Post content */}
            <p className="text-white text-base mb-4 line-clamp-3">
              {post.body}
            </p>
          </div>

          {/* Right sidebar actions */}
          <div className="absolute right-4 bottom-32 flex flex-col gap-6 z-20">
            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white font-medium">0</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-white font-medium">0</span>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <Share2 className="w-6 h-6 text-white" />
              </div>
            </button>

            <button className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                <MoreVertical className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>

          {/* Progress indicator */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 z-20">
            {posts.slice(Math.max(0, idx - 2), idx + 3).map((_, i) => {
              const actualIdx = Math.max(0, idx - 2) + i;
              return (
                <div
                  key={actualIdx}
                  className={cn(
                    "h-0.5 rounded-full transition-all",
                    actualIdx === idx
                      ? "w-8 bg-white"
                      : "w-1.5 bg-white/40"
                  )}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
