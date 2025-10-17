// Profile & Identity types for P0 features

export type PinType = 
  | 'earnings' 
  | 'events' 
  | 'horses' 
  | 'tasks' 
  | 'calendar' 
  | 'crm' 
  | 'marketplace' 
  | 'analytics';

export interface ProfilePin {
  id: string;
  user_id: string;
  pin_type: PinType;
  ref_id: string | null;
  pin_position: number;
  label: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export type FavoriteType = 
  | 'post' 
  | 'event' 
  | 'entity' 
  | 'horse' 
  | 'listing';

export interface Favorite {
  id: string;
  user_id: string;
  fav_type: FavoriteType;
  ref_id: string;
  created_at: string;
}

export interface Repost {
  id: string;
  post_id: string;
  by_entity_id: string;
  source_post_id: string;
  created_at: string;
}

export type LinkedAccountProvider = 
  | 'twitter' 
  | 'instagram' 
  | 'facebook' 
  | 'youtube' 
  | 'tiktok';

export interface LinkedAccount {
  id: string;
  user_id: string;
  provider: LinkedAccountProvider;
  handle: string;
  verified: boolean;
  proof_url: string | null;
  linked_at: string;
}

export type EdgeType = 
  | 'owns' 
  | 'manages' 
  | 'parent' 
  | 'sponsors' 
  | 'partners';

export interface EntityEdge {
  id: string;
  from_entity_id: string;
  to_entity_id: string;
  edge_type: EdgeType;
  allow_crosspost: boolean;
  auto_propagate: boolean;
  require_approval: boolean;
  created_at: string;
}
