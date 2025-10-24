/**
 * Role: Infinite scroll feed component
 * Path: src/apps/yalls-social/components/Feed.tsx
 * Uses: TanStack infinite query, responsive grid
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { fetchFeed, type Post } from '../services/feed.service';

interface FeedProps {
  userId: string;
}

export function Feed({ userId }: FeedProps) {
  const { ref, inView } = useInView();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', userId],
    queryFn: ({ pageParam = 0 }) => fetchFeed(userId, pageParam),
    getNextPageParam: (lastPage, pages) => pages.length,
    initialPageParam: 0,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const posts = data?.pages.flat() || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {posts.map((post) => (
        <div key={post.id} className="border rounded-lg p-4">
          <p className="font-semibold">{post.author}</p>
          <p className="text-sm text-muted-foreground">{post.content}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs">❤️ {post.likes}</span>
            <span className="text-xs">🔥 {post.viralScore?.toFixed(1)}</span>
          </div>
        </div>
      ))}
      <div ref={ref} className="col-span-full flex justify-center py-4">
        {isFetchingNextPage && <p>Loading more...</p>}
      </div>
    </div>
  );
}
