import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';

type Totals = { following: number; followers: number; likes: number };

export default function ProfileSummaryBar() {
  const { session } = useSession();
  const userId = session?.userId;
  const userEmail = session?.email;

  const [name, setName] = useState('You');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [totals, setTotals] = useState<Totals>({ following: 0, followers: 0, likes: 0 });

  useEffect(() => {
    if (!userId) return;

    (async () => {
      // 1) Basic profile
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      setName(
        prof?.display_name ??
          userEmail?.split('@')[0] ??
          'You'
      );
      setAvatar(prof?.avatar_url ?? undefined);

      // 2) Totals (safe fallback if RPC not present)
      let next: Totals = { following: 0, followers: 0, likes: 0 };
      try {
        const { data } = await supabase.rpc('get_user_aggregate_counts', { p_user_id: userId }).single();
        if (data) {
          next = {
            following: Number(data.following_count ?? 0),
            followers: Number(data.followers_count ?? 0),
            likes: Number(data.likes_count ?? 0),
          };
        }
      } catch {
        // no-op; leave zeros
      }
      setTotals(next);
    })();
  }, [userId, userEmail]);

  if (!userId) return null;

  return (
    <Link
      to="/profile"
      className="flex flex-col items-center gap-2 px-2 py-2 hover:bg-muted/30 rounded-lg transition-colors"
      aria-label="Open your profile"
    >
      {/* Avatar */}
      <div className="relative h-[72px] w-[72px] rounded-full overflow-hidden ring-2 ring-primary/60 shrink-0">
        {avatar ? (
          <img src={avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-muted text-base">👤</div>
        )}
      </div>

      {/* Name centered */}
      <div className="text-base font-semibold text-center">{name}</div>

      {/* Totals centered */}
      <div className="flex gap-6 text-sm">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{totals.following}</span>
          <span className="text-xs text-muted-foreground">Following</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{totals.followers}</span>
          <span className="text-xs text-muted-foreground">Followers</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-foreground">{totals.likes}</span>
          <span className="text-xs text-muted-foreground">Likes</span>
        </div>
      </div>
    </Link>
  );
}
