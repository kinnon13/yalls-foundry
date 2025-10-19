import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeedPost {
  id: string;
  author_id: string;
  body: string | null;
  media: any[];
  created_at: string;
  author: {
    display_name: string | null;
    avatar_url: string | null;
    handle: string | null;
  };
}

export function useFeedPosts(tab: 'following' | 'for-you' | 'shop' | 'profile' = 'for-you') {
  return useQuery({
    queryKey: ['feed-posts', tab],
    queryFn: async () => {
      // Simple query - just get all public posts for now
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          author_id,
          body,
          media,
          created_at,
          profiles:author_id (
            display_name,
            avatar_url,
            handle
          )
        `)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Feed query error:', error);
        return [];
      }
      
      // Transform to match expected format
      return (data || []).map(post => ({
        id: post.id,
        author_id: post.author_id,
        body: post.body,
        media: post.media || [],
        created_at: post.created_at,
        author: {
          display_name: (post.profiles as any)?.display_name || 'Unknown',
          avatar_url: (post.profiles as any)?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
          handle: (post.profiles as any)?.handle || 'user',
        },
      })) as FeedPost[];
    },
    staleTime: 30000, // 30 seconds
  });
}
