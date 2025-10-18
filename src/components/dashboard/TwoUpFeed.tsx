/**
 * TwoUpFeed - Shows two posts at once in the sidecar
 */

import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateMockPosts } from '@/lib/mock/posts';

type FeedKey = 'following' | 'foryou' | 'shop';

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
}

export function TwoUpFeed({ feedKey }: { feedKey: FeedKey }) {
  const ref = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Measure container height
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Calculate post height: 50% of container minus gutter
  const postHeight = Math.max(260, (containerHeight - 12) / 2);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['feed', feedKey],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // For now, use mock posts
      if (!user) {
        return generateMockPosts(0, 10);
      }

      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            body,
            media,
            created_at,
            author_user_id,
            profiles (display_name, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error || !data || data.length === 0) {
          return generateMockPosts(0, 10);
        }

        return data;
      } catch {
        return generateMockPosts(0, 10);
      }
    }
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div ref={ref} className="h-full overflow-auto px-3 py-3 space-y-3 scrollbar-thin">
      {items.map((item: Post) => (
        <PostCard key={item.id} item={item} height={postHeight} />
      ))}
      <div className="h-8" />
    </div>
  );
}

function PostCard({ item, height }: { item: Post; height: number }) {
  return (
    <div 
      className="relative rounded-xl overflow-hidden bg-muted border border-border/40"
      style={{ height: `${height}px` }}
    >
      {/* Background media */}
      {item.media?.url && (
        <img
          src={item.media.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end p-4">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          {item.profiles?.avatar_url ? (
            <img
              src={item.profiles.avatar_url}
              alt={item.profiles.display_name}
              className="w-8 h-8 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
              {item.profiles?.display_name?.[0] || '?'}
            </div>
          )}
          <div className="text-white text-sm font-medium">
            {item.profiles?.display_name || 'Anonymous'}
          </div>
        </div>

        {/* Body */}
        <p className="text-white text-sm line-clamp-2 mb-3">
          {item.body}
        </p>
      </div>

      {/* Compact action buttons */}
      <div className="absolute right-2 bottom-2 flex gap-2 z-20">
        <ActionButton icon={Heart} label="24K" />
        <ActionButton icon={MessageCircle} label="1.2K" />
        <ActionButton icon={Bookmark} />
        <ActionButton icon={Share2} />
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label }: { icon: any; label?: string }) {
  return (
    <button className="flex flex-col items-center gap-0.5 group">
      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
        <Icon className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
      {label && (
        <span className="text-[10px] text-white font-medium">{label}</span>
      )}
    </button>
  );
}
