/**
 * Role: Infinite scroll feed component with viral posts and embedded shopping
 * Path: yalls-inc/yalls-social/src/components/Feed.tsx
 * Responsive: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
 * Imports: @tanstack/react-query, @/lib/auth/context, ./QuickBuy
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { useSession } from '@/lib/auth/context';
import { fetchFeed } from '../services/feed.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { QuickBuy } from './QuickBuy';

interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  media_url?: string;
  likes_count: number;
  comments_count: number;
  viral_score: number;
  product_id?: string;
  created_at: string;
}

export function Feed() {
  const { session } = useSession();
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['social-feed', session?.userId],
    queryFn: ({ pageParam = 0 }) => fetchFeed(session?.userId || '', pageParam),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.length === 20 ? pages.length : undefined;
    },
    enabled: !!session?.userId,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flat() || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div 
      className="container mx-auto px-3 sm:px-4 py-4 sm:py-6"
      data-testid="yalls-social-feed"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {posts.map((post: FeedPost) => (
          <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {post.media_url && (
              <div className="aspect-video bg-muted">
                <img 
                  src={post.media_url} 
                  alt="Post media" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-sm sm:text-base line-clamp-2">{post.content}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Viral Score: {post.viral_score.toFixed(2)}
              </CardDescription>
            </CardHeader>
            
            {post.product_id && (
              <CardContent>
                <QuickBuy productId={post.product_id} postId={post.id} />
              </CardContent>
            )}

            <CardFooter className="flex justify-between text-xs sm:text-sm">
              <Button variant="ghost" size="sm" className="gap-1">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                {post.likes_count}
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                {post.comments_count}
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div ref={ref} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        )}
      </div>
    </div>
  );
}
