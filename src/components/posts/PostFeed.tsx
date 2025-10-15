import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PostCard } from './PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Post {
  id: string;
  body?: string;
  author_id: string;
  created_at: string;
  media?: any;
  visibility: string;
}

interface Profile {
  user_id: string;
  display_name?: string;
  avatar_url?: string;
}

export function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch public posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      if (postsData && postsData.length > 0) {
        setPosts(postsData);

        // Fetch author profiles
        const authorIds = [...new Set(postsData.map(p => p.author_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', authorIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else if (profilesData) {
          const profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {} as Record<string, Profile>);
          setProfiles(profilesMap);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No posts yet. Be the first to share something!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          author={profiles[post.author_id]}
          onSaved={fetchPosts}
          onReshared={fetchPosts}
        />
      ))}
    </div>
  );
}
