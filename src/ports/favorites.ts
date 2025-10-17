export type FavoriteType = 'post' | 'event' | 'entity' | 'horse' | 'listing';

export interface Favorite {
  id: string;
  user_id: string;
  fav_type: FavoriteType;
  ref_id: string;
  created_at: string;
}

export interface FavoritesPort {
  toggle(userId: string, fav_type: FavoriteType, ref_id: string): Promise<{ is_favorited: boolean }>;
  list(userId: string, fav_type?: FavoriteType): Promise<Favorite[]>;
  check(userId: string, items: { fav_type: string; ref_id: string }[]): Promise<{ ref_id: string; is_favorited: boolean }[]>;
}
