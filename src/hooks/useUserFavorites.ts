import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Favorite {
  id: string;
  fav_type: string;
  ref_id: string;
  display_name: string;
  avatar_url?: string;
  handle?: string;
}

export function useUserFavorites(userId?: string) {
  return useQuery({
    queryKey: ['userFavorites', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: favoritesData, error } = await supabase
        .from('favorites')
        .select('id, fav_type, ref_id')
        .eq('user_id', userId)
        .limit(10);

      if (error) throw error;
      if (!favoritesData || favoritesData.length === 0) return [];

      // Get details for each favorite based on type
      const favoritesWithDetails = await Promise.all(
        favoritesData.map(async (fav) => {
          if (fav.fav_type === 'user' || fav.fav_type === 'profile') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url, handle')
              .eq('user_id', fav.ref_id)
              .single();

            return {
              id: fav.id,
              fav_type: fav.fav_type,
              ref_id: fav.ref_id,
              display_name: profile?.display_name || 'User',
              avatar_url: profile?.avatar_url,
              handle: profile?.handle,
            };
          }

          if (fav.fav_type === 'entity') {
            const { data: entity } = await supabase
              .from('entities')
              .select('display_name, metadata')
              .eq('id', fav.ref_id)
              .single();

            const metadata = entity?.metadata as Record<string, any> | null;

            return {
              id: fav.id,
              fav_type: fav.fav_type,
              ref_id: fav.ref_id,
              display_name: entity?.display_name || 'Entity',
              avatar_url: metadata?.avatar_url,
            };
          }

          // Default for other types
          return {
            id: fav.id,
            fav_type: fav.fav_type,
            ref_id: fav.ref_id,
            display_name: 'Item',
          };
        })
      );

      return favoritesWithDetails;
    },
    enabled: !!userId,
  });
}
