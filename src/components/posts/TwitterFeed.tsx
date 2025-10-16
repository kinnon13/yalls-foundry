import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from './PostCard';
import { Loader2 } from 'lucide-react';
import { resolveTenantId } from '@/lib/tenancy/context';

export function TwitterFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
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
        .limit(50);

      if (error) throw error;
      if (postsData) setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
      
      {posts.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No text posts yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}