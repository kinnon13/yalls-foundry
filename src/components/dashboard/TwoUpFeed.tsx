/**
 * TwoUpFeed - Shows two posts at once in the sidecar
 */

import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Heart, MessageCircle, Share2, Bookmark, Repeat2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateMockPosts } from '@/lib/mock/posts';

type FeedKey = 'following' | 'foryou' | 'shop';

interface Post {
  id: string;
  body: string;
  media?: any;
  media_url?: string;
  created_at: string;
  author_user_id: string;
  profiles?: {
    display_name: string;
    avatar_url?: string;
  };
  likes?: number;
  comments?: number;
  saves?: number;
  reposts?: number;
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
        <PostCard key={item.id} item={item} />
      ))}
      <div className="h-8" />
    </div>
  );
}

function PostCard({ item }: { item: Post }) {
  return (
    <article className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-black/50">
      {item.media_url && (
        <img 
          src={item.media_url} 
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-2 mb-2">
          {item.profiles?.avatar_url ? (
            <img 
              src={item.profiles.avatar_url} 
              alt={item.profiles.display_name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted" />
          )}
          <span className="text-sm font-medium text-white">
            {item.profiles?.display_name || 'Anonymous'}
          </span>
        </div>
        <p className="text-sm text-white/90 line-clamp-2">{item.body}</p>
      </div>

      <div className="absolute right-2 bottom-2 flex flex-col items-center gap-3">
        <ActionButton icon={Heart} label={item.likes} />
        <ActionButton icon={MessageCircle} label={item.comments} />
        <ActionButton icon={Bookmark} label={item.saves} />
        <ActionButton icon={Repeat2} label={item.reposts} />
        <ActionButton icon={Share2} />
      </div>
    </article>
  );
}

function ActionButton({ icon: Icon, label }: { icon: any; label?: string | number }) {
  const displayLabel = typeof label === 'number' 
    ? label > 999 ? `${(label / 1000).toFixed(1)}k` : label.toString()
    : label;

  return (
    <button className="h-11 w-11 rounded-full bg-black/40 hover:bg-black/60 grid place-items-center backdrop-blur-sm transition-colors">
      <div className="grid place-items-center text-xs text-white">
        <Icon className="w-5 h-5 mb-0.5" />
        {displayLabel && <div className="text-[10px]">{displayLabel}</div>}
      </div>
    </button>
  );
}
