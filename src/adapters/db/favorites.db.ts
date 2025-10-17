import { FavoritesPort, Favorite, FavoriteType } from '@/ports/favorites';
import { supabase } from '@/integrations/supabase/client';

export const favoritesDb: FavoritesPort = {
  async toggle(userId, fav_type, ref_id) {
    // TODO: Wire when favorite_toggle RPC exists
    return { is_favorited: false };
  },

  async list(userId, fav_type?) {
    // TODO: Wire to favorites table when ready
    return [];
  },

  async check(userId, items) {
    // TODO: Wire when favorites_check RPC exists
    return [];
  },
};
