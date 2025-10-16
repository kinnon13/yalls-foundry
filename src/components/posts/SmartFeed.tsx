/**
 * Smart Feed - Adapts layout based on user preferences and interactions
 * Supports TikTok (vertical video), Instagram (photo grid), and Facebook (text-heavy) layouts
 */

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from './PostCard';
import { Loader2, LayoutGrid, Rows3, Video, Settings2 } from 'lucide-react';
import { resolveTenantId } from '@/lib/tenancy/context';
import { useFeedPreferences, FeedLayout } from '@/hooks/useFeedPreferences';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function SmartFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

  const {
    preferences,
    loading: prefsLoading,
    updateLayout,
    detectedLayout,
    isUserHidden,
    hideUser,
    unhideUser
  } = useFeedPreferences();

  const activeLayout = preferences?.feed_layout === 'auto' ? detectedLayout : (preferences?.feed_layout || 'instagram');

  const loadPosts = async (pageNum: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const tenantId = user ? await resolveTenantId(user.id) : '00000000-0000-0000-0000-000000000000';

      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (
            user_id,
            display_name,
            avatar_url
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      if (postsData) {
        // Filter out hidden users
        const filteredPosts = postsData.filter(post => 
          !isUserHidden(post.author_id)
        );

        if (filteredPosts.length < PAGE_SIZE) setHasMore(false);
        setPosts(prev => pageNum === 0 ? filteredPosts : [...prev, ...filteredPosts]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!prefsLoading) {
      loadPosts(0);
    }
  }, [prefsLoading]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 0) {
      setLoading(true);
      loadPosts(page);
    }
  }, [page]);

  const renderLayout = () => {
    switch (activeLayout) {
      case 'tiktok':
        return (
          <div className="max-w-2xl mx-auto space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="min-h-[80vh] flex items-center">
                <PostCard
                  post={post}
                  author={post.profiles}
                  onSaved={() => loadPosts(0)}
                  onReshared={() => loadPosts(0)}
                />
              </div>
            ))}
          </div>
        );

      case 'instagram':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={post.profiles}
                onSaved={() => loadPosts(0)}
                onReshared={() => loadPosts(0)}
              />
            ))}
          </div>
        );

      case 'facebook':
        return (
          <div className="max-w-2xl mx-auto space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                author={post.profiles}
                onSaved={() => loadPosts(0)}
                onReshared={() => loadPosts(0)}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Layout Selector */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {preferences?.feed_layout === 'auto' && (
            <Badge variant="secondary" className="gap-1">
              Auto-detected: {detectedLayout}
            </Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Feed Layout
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Choose Layout</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateLayout('auto')}>
              <Settings2 className="h-4 w-4 mr-2" />
              Auto (Learn from me)
              {preferences?.feed_layout === 'auto' && ' ✓'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateLayout('tiktok')}>
              <Video className="h-4 w-4 mr-2" />
              TikTok Style
              {preferences?.feed_layout === 'tiktok' && ' ✓'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateLayout('instagram')}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Instagram Style
              {preferences?.feed_layout === 'instagram' && ' ✓'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateLayout('facebook')}>
              <Rows3 className="h-4 w-4 mr-2" />
              Facebook Style
              {preferences?.feed_layout === 'facebook' && ' ✓'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Feed Content */}
      {renderLayout()}
      
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <p className="text-center text-muted-foreground py-8">
          You've reached the end!
        </p>
      )}
      
      {posts.length === 0 && !loading && (
        <p className="text-center text-muted-foreground py-8">
          No posts yet. Be the first to share something!
        </p>
      )}
    </div>
  );
}
