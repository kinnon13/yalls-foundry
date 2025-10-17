export type FeedItemKind = 'post' | 'listing' | 'event';

export type FeedItemBase = {
  kind: FeedItemKind;
  id: string;
  entity_id: string;
  created_at: string;
  score: number;
};

export type PostFeedItem = FeedItemBase & {
  kind: 'post';
  body: string;
  media: any[];
  author_user_id?: string;
  labels?: Array<'auto' | 'repost' | 'cross_post'>;
};

export type ListingFeedItem = FeedItemBase & {
  kind: 'listing';
  title: string;
  price_cents: number;
  media: any[];
  stock_quantity?: number;
  seller_entity_id?: string;
};

export type EventFeedItem = FeedItemBase & {
  kind: 'event';
  title: string;
  starts_at?: string;
  location?: any;
  host_entity_id?: string;
};

export type FeedItem = PostFeedItem | ListingFeedItem | EventFeedItem;

export type FeedMode = 'personal' | 'combined';
export type ProfileFeedMode = 'this' | 'combined';

// RPC response from feed_fusion_*
export interface FusionFeedItem {
  item_type: 'post' | 'listing' | 'event';
  item_id: string;
  entity_id: string;
  created_at: string;
  rank: number;
  payload: Record<string, any>;
}
