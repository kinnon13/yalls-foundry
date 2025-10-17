/**
 * Profile Counts - Aggregated or Entity-specific (<100 LOC)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Heart } from 'lucide-react';

type ProfileCountsProps = {
  userId?: string;
  entityId?: string;
  isUserProfile: boolean;
};

export function ProfileCounts({ userId, entityId, isUserProfile }: ProfileCountsProps) {
  const { data: counts } = useQuery({
    queryKey: ['profile-counts', userId, entityId, isUserProfile],
    queryFn: async () => {
      if (isUserProfile && userId) {
        // Aggregate counts across all owned entities
        const { data, error } = await supabase
          .rpc('get_user_aggregate_counts', { p_user_id: userId });

        if (error) throw error;
        return data?.[0] || { followers_count: 0, following_count: 0, likes_count: 0 };
      } else if (entityId) {
        // Entity-specific counts from metadata
        const { data, error } = await supabase
          .from('entities')
          .select('metadata')
          .eq('id', entityId)
          .single();

        if (error) throw error;
        const meta = (data?.metadata || {}) as Record<string, any>;
        return {
          followers_count: Number(meta.followers_count) || 0,
          following_count: Number(meta.following_count) || 0,
          likes_count: Number(meta.likes_count) || 0,
        };
      }
      return { followers_count: 0, following_count: 0, likes_count: 0 };
    }
  });

  return (
    <div className="flex gap-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold">{counts?.followers_count || 0}</span>
        </div>
        <p className="text-xs text-muted-foreground">Followers</p>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <UserPlus className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold">{counts?.following_count || 0}</span>
        </div>
        <p className="text-xs text-muted-foreground">Following</p>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center gap-1">
          <Heart className="h-4 w-4 text-muted-foreground" />
          <span className="text-2xl font-bold">{counts?.likes_count || 0}</span>
        </div>
        <p className="text-xs text-muted-foreground">Likes</p>
      </div>
    </div>
  );
}
