// useScrollerFeed hook - Feed Fusion (PR5b - direct lane support)
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeedItem } from '@/types/feed';

type HomeLane = 'for_you' | 'following' | 'shop';
type ProfileLane = 'this' | 'combined';

interface HomeFeedParams {
  lane: HomeLane;
  pageSize?: number;
}

interface ProfileFeedParams {
  lane: ProfileLane;
  entityId: string;
  pageSize?: number;
}

type FeedParams = HomeFeedParams | ProfileFeedParams;

interface FeedPage {
  items: FeedItem[];
  nextCursor: string;
}

export function useScrollerFeed(params: FeedParams) {
  const { pageSize = 20 } = params;
  const isProfileFeed = 'entityId' in params;
  const lane = params.lane;
  const entityId = isProfileFeed ? params.entityId : undefined;

  return useInfiniteQuery<FeedPage>({
    queryKey: ['feed-fusion', lane, entityId],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ?? new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      const rpcName = isProfileFeed ? 'feed_fusion_profile' : 'feed_fusion_home';
      const rpcParams = isProfileFeed
        ? {
            p_entity_id: entityId,
            p_user_id: user?.id,
            p_lane: lane,
            p_cursor: cursor,
            p_limit: pageSize
          }
        : {
            p_user_id: user?.id,
            p_lane: lane,
            p_cursor: cursor,
            p_limit: pageSize
          };

      const { data, error } = await (supabase.rpc as any)(rpcName, rpcParams);

      if (error) {
        console.error('[useScrollerFeed] RPC error:', error);
        throw error;
      }

      // Transform RPC results to FeedItem[]
      const items: FeedItem[] = ((data as any[]) || []).map((row: any) => ({
        kind: row.item_type || row.payload?.kind,
        id: row.item_id || row.payload?.id,
        score: row.score,
        created_at: row.created_at,
        ...row.payload
      }));

      // Log usage event
      if (user?.id && items.length > 0) {
        await (supabase as any).from('usage_events').insert({
          user_id: user.id,
          event_type: 'feed_view',
          payload: { lane, cursor, count: items.length }
        });
      }

      const nextCursor = items.length > 0
        ? items[items.length - 1]?.created_at || cursor
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
