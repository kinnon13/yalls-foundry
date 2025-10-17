/**
 * Scroller Feed Hook
 * 
 * Fetches feed items using feed_fusion_home/profile RPCs with cursor pagination.
 * Handles infinite scroll, rate limiting, and cursor management.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import type { FeedItem } from '@/types/feed';

interface UseScrollerFeedParams {
  lane: 'combined' | 'personal' | 'profile';
  entityId?: string;
  limit?: number;
}

interface FeedPage {
  items: FeedItem[];
  nextCursor: { ts: string | null; id: string | null };
}

export function useScrollerFeed({ lane, entityId, limit = 50 }: UseScrollerFeedParams) {
  const { session } = useSession();
  
  return useInfiniteQuery<FeedPage>({
    queryKey: ['scroller-feed', lane, entityId, session?.userId],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam as { ts: string | null; id: string | null } | undefined;
      
      const isProfile = lane === 'profile';
      const rpcName = isProfile ? 'feed_fusion_profile' : 'feed_fusion_home';
      
      const params = isProfile
        ? {
            p_entity_id: entityId,
            p_mode: 'this_page',
            p_cursor_ts: cursor?.ts || null,
            p_cursor_id: cursor?.id || null,
            p_limit: limit,
          }
        : {
            p_user_id: session?.userId,
            p_mode: lane,
            p_cursor_ts: cursor?.ts || null,
            p_cursor_id: cursor?.id || null,
            p_limit: limit,
          };

      const { data, error } = await supabase.rpc(rpcName, params as any);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { items: [], nextCursor: { ts: null, id: null } };
      }

      // Map RPC result to FeedItem format
      const items: FeedItem[] = data.map((row: any) => ({
        id: row.item_id,
        kind: row.item_type === 'listing' ? 'listing' : row.item_type === 'event' ? 'event' : 'post',
        entity_id: row.entity_id,
        created_at: row.created_at,
        rank: row.rank,
        ...row.payload,
      }));

      // Extract next cursor from the last item
      const lastItem = data[data.length - 1];
      const nextCursor = {
        ts: lastItem?.next_cursor_ts || null,
        id: lastItem?.next_cursor_id || null,
      };

      return { items, nextCursor };
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.nextCursor.ts || !lastPage.nextCursor.id) {
        return undefined;
      }
      return lastPage.nextCursor;
    },
    enabled: !!session?.userId || lane === 'profile',
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
