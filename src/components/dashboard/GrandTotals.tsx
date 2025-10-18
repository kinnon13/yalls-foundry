/**
 * Grand Totals - Aggregated stats across all user's entities
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function GrandTotals() {
  const { data } = useQuery({
    queryKey: ['grand-totals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total_following: 0, total_followers: 0, total_likes: 0 };
      
      const { data: stats } = await supabase.rpc('user_aggregate_social_stats', { 
        p_user_id: user.id 
      });
      
      return stats?.[0] ?? { total_following: 0, total_followers: 0, total_likes: 0 };
    }
  });

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="font-medium text-foreground">{data?.total_following ?? 0}</span>
        Following
      </span>
      <span className="opacity-40">•</span>
      <span className="flex items-center gap-1">
        <span className="font-medium text-foreground">{data?.total_followers ?? 0}</span>
        Followers
      </span>
      <span className="opacity-40">•</span>
      <span className="flex items-center gap-1">
        <span className="font-medium text-foreground">{data?.total_likes ?? 0}</span>
        Likes
      </span>
    </div>
  );
}
