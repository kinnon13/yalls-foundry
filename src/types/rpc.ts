import type { FeedItemKind } from './feed';

export type FusionFeedItem = {
  item_type: FeedItemKind;
  item_id: string;
  entity_id: string;
  created_at: string;
  rank: number;
  payload: Record<string, unknown>;
};
