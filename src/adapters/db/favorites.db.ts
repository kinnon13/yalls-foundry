import { FavoritesPort, Favorite, FavoriteType } from '@/ports/favorites';
import { supabase } from '@/integrations/supabase/client';

export const favoritesDb: FavoritesPort = {
  async toggle(userId, fav_type, ref_id) {
    const { data, error } = await supabase.rpc('favorite_toggle', {
      p_fav_type: fav_type,
      p_ref_id: ref_id
    });
    if (error) throw error;
    const result = data as { is_favorited: boolean; fav_type: string; ref_id: string } | null;
    return { is_favorited: result?.is_favorited ?? false };
  },

  async list(userId, fav_type?) {
    const { data, error } = await supabase.rpc('favorites_list', {
      p_user_id: userId,
      p_fav_type: fav_type || null
    });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      fav_type: row.fav_type as FavoriteType,
      ref_id: row.ref_id,
      created_at: row.created_at
    }));
  },

  async check(userId, items) {
    const { data, error } = await supabase.rpc('favorites_check', {
      p_items: items
    });
    if (error) throw error;
    return (data || []).map((row: any) => ({
      ref_id: row.ref_id,
      is_favorited: row.is_favorited
    }));
  },
};
