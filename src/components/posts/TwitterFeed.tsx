import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from './PostCard';
import { Loader2 } from 'lucide-react';
import { resolveTenantId } from '@/lib/tenancy/context';

export function TwitterFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 20;

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
        .eq('kind', 'text')
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (error) throw error;

      if (postsData) {
        if (postsData.length < PAGE_SIZE) setHasMore(false);
        setPosts(prev => pageNum === 0 ? postsData : [...prev, ...postsData]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(0);
  }, []);

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

  if (loading && posts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          author={post.profiles}
          onSaved={() => {}}
          onReshared={() => {}}
        />
      ))}
      
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
          No text posts yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}