// useScrollerFeed hook - Feed Fusion (PR5a)
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeedItem, FeedMode, ProfileFeedMode } from '@/types/feed';

interface FeedParams {
  mode: FeedMode | ProfileFeedMode;
  entityId?: string; // for profile feeds
  pageSize?: number;
}

interface FeedPage {
  items: FeedItem[];
  nextCursor: string;
}

export function useScrollerFeed({ mode, entityId, pageSize = 20 }: FeedParams) {
  const isProfileFeed = Boolean(entityId);

  return useInfiniteQuery<FeedPage>({
    queryKey: ['feed-fusion', mode, entityId],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ?? new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      const rpcName = isProfileFeed ? 'feed_fusion_profile' : 'feed_fusion_home';
      const params = isProfileFeed
        ? {
            p_entity_id: entityId,
            p_user_id: user?.id,
            p_mode: mode,
            p_cursor: cursor,
            p_limit: pageSize
          }
        : {
            p_user_id: user?.id,
            p_mode: mode,
            p_cursor: cursor,
            p_limit: pageSize
          };

      const { data, error } = await (supabase.rpc as any)(rpcName, params);

      if (error) {
        console.error('[useScrollerFeed] RPC error:', error);
        throw error;
      }

      // Transform RPC results to FeedItem[]
      const items: FeedItem[] = ((data as any[]) || []).map((row: any) => ({
        kind: row.item_type || row.payload?.kind,
        id: row.item_id || row.payload?.id,
        score: row.score,
        ...row.payload
      }));

      // Log usage event
      if (user?.id && items.length > 0) {
        await (supabase as any).from('usage_events').insert({
          user_id: user.id,
          event_type: 'feed_view',
          payload: { mode, cursor, count: items.length }
        });
      }

      const nextCursor = items.length > 0
        ? items[items.length - 1]?.score?.toString() || new Date().toISOString()
        : cursor;

      return {
        items,
        nextCursor: String(nextCursor)
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.items.length === pageSize ? lastPage.nextCursor : undefined,
    initialPageParam: undefined
  });
}
