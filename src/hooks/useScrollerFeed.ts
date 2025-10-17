// useScrollerFeed hook - Feed Fusion with infinite scroll (PR5c + Master Plan)
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { FeedItem, FusionFeedItem, PostFeedItem, ListingFeedItem, EventFeedItem, FeedItemKind } from '@/types/feed';
import { useEffect, useRef } from 'react';
import { logUsage, getSessionId } from '@/lib/telemetry/usage';

type HomeLane = 'personal' | 'combined';
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
  nextCursor: string | null;
}

export function useScrollerFeed(params: FeedParams) {
  const { pageSize = 20 } = params;
  const isProfileFeed = 'entityId' in params;
  const lane = params.lane;
  const entityId = isProfileFeed ? params.entityId : undefined;
  const impressionTracked = useRef<Set<string>>(new Set());

  const query = useInfiniteQuery<FeedPage>({
    queryKey: ['feed-fusion', lane, entityId],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam ?? null;
      const { data: { user } } = await supabase.auth.getUser();

      const rpcName = isProfileFeed ? 'feed_fusion_profile' : 'feed_fusion_home';
      const rpcParams = isProfileFeed
        ? {
            p_entity_id: entityId,
            p_mode: lane
          }
        : {
            p_user_id: user?.id || null,
            p_mode: lane
          };

      const { data, error } = await (supabase.rpc as any)(rpcName, rpcParams);

      if (error) {
        console.error('[useScrollerFeed] RPC error:', error);
        throw error;
      }

      // Transform RPC results to FeedItem[]
      const items: FeedItem[] = ((data as FusionFeedItem[]) || []).map((row) => {
        const base = {
          kind: row.item_type as FeedItemKind,
          id: row.item_id,
          score: row.rank,
          created_at: row.created_at,
          entity_id: row.entity_id,
        };
        
        if (row.item_type === 'post') {
          return {
            ...base,
            kind: 'post' as const,
            body: row.payload.body || '',
            media: row.payload.media || [],
            author_user_id: row.payload.author_user_id,
          } as PostFeedItem;
        } else if (row.item_type === 'listing') {
          return {
            ...base,
            kind: 'listing' as const,
            title: row.payload.title || '',
            price_cents: row.payload.price_cents || 0,
            media: row.payload.media || [],
            stock_quantity: row.payload.stock_quantity,
            seller_entity_id: row.payload.seller_entity_id,
          } as ListingFeedItem;
        } else {
          return {
            ...base,
            kind: 'event' as const,
            title: row.payload.title || '',
            starts_at: row.payload.starts_at,
            location: row.payload.location,
            host_entity_id: row.payload.host_entity_id,
          } as EventFeedItem;
        }
      });

      const nextCursor = items.length === pageSize 
        ? items[items.length - 1]?.created_at || null
        : null;

      return {
        items,
        nextCursor: nextCursor ? String(nextCursor) : null
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null as string | null
  });

  // Track impressions when data loads
  useEffect(() => {
    if (!query.data) return;
    
    const sessionId = getSessionId();
    const surface = isProfileFeed ? `profile_${lane}` : `home_${lane}`;
    
    query.data.pages.forEach((page, pageIndex) => {
      page.items.forEach((item, itemIndex) => {
        const trackKey = `${item.id}-${pageIndex}`;
        if (impressionTracked.current.has(trackKey)) return;
        
        impressionTracked.current.add(trackKey);
        logUsage({
          sessionId,
          type: 'impression',
          surface,
          itemKind: item.kind,
          itemId: item.id,
          lane: lane || null,
          position: pageIndex * pageSize + itemIndex,
        });
      });
    });
  }, [query.data, lane, isProfileFeed, pageSize]);

  return query;
}
