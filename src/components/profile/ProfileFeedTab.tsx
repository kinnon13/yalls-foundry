/**
 * Profile Feed Tab Component
 * Renders feed items for a specific profile using feed_fusion_profile
 */

import { useScrollerFeed } from '@/hooks/useScrollerFeed';
import { TikTokScroller } from '@/components/feed/TikTokScroller';
import { Loader2 } from 'lucide-react';

interface ProfileFeedTabProps {
  entityId: string;
  mode: 'this_page' | 'combined';
}

export function ProfileFeedTab({ entityId }: ProfileFeedTabProps) {
  const feed = useScrollerFeed({ 
    lane: 'profile' as 'combined' | 'personal' | 'profile', 
    entityId 
  });
  
  const allItems = feed.data?.pages.flatMap(page => page.items) ?? [];

  if (feed.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <TikTokScroller
      items={allItems}
      onLoadMore={() => feed.fetchNextPage()}
      hasNextPage={feed.hasNextPage}
      isLoading={feed.isFetchingNextPage}
    />
  );
}
