// Feed Fusion Types (PR5a)
export type FeedItemKind = 'post' | 'listing' | 'event';

export interface FeedItemBase {
  kind: FeedItemKind;
  id: string;
  score?: number;
  entity_id?: string;
}

export interface PostFeedItem extends FeedItemBase {
  kind: 'post';
  body: string;
  media: Array<{ url: string; type: 'image' | 'video' }>;
  author_user_id?: string;
  labels?: Array<'auto' | 'repost' | 'cross_post'>;
}

export interface ListingFeedItem extends FeedItemBase {
  kind: 'listing';
  title: string;
  price_cents: number;
  media: Array<{ url: string; type: 'image' | 'video' }>;
  stock_quantity?: number;
}

export interface EventFeedItem extends FeedItemBase {
  kind: 'event';
  title: string;
  starts_at?: string;
  location?: any;
}

export type FeedItem = PostFeedItem | ListingFeedItem | EventFeedItem;

export type FeedMode = 'personal' | 'combined';
export type ProfileFeedMode = 'this' | 'combined';
