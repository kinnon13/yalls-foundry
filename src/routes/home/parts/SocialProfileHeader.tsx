import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Menu, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SocialProfileHeader() {
  const { session } = useSession();
  const userId = session?.userId;
  const userEmail = session?.email;

  const [name, setName] = useState('User');
  const [handle, setHandle] = useState('username');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [totals, setTotals] = useState({ following: 0, followers: 0, likes: 0 });

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      setName(prof?.display_name ?? userEmail?.split('@')[0] ?? 'User');
      setHandle(prof?.display_name?.toLowerCase().replace(/\s+/g, '') ?? 'username');
      setAvatar(prof?.avatar_url ?? undefined);

      try {
        const { data } = await supabase.rpc('get_user_aggregate_counts', { p_user_id: userId }).single();
        if (data) {
          setTotals({
            following: Number(data.following_count ?? 0),
            followers: Number(data.followers_count ?? 0),
            likes: Number(data.likes_count ?? 0),
          });
        }
      } catch {
        // no-op
      }
    })();
  }, [userId, userEmail]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="bg-background py-3 px-4 border-b">
      {/* Top bar - icons */}
      <div className="flex items-center justify-between mb-3">
        <UserPlus className="w-5 h-5" />
        <div className="flex items-center gap-3">
          <Share2 className="w-5 h-5" />
          <Menu className="w-5 h-5" />
        </div>
      </div>

      {/* Profile picture */}
      <div className="flex justify-center mb-3">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden ring-2 ring-primary/20">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-3xl">
                👤
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg">
            +
          </button>
        </div>
      </div>

      {/* Name and handle */}
      <div className="text-center mb-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-xl font-bold">{name}</h1>
          <span className="text-xs">▼</span>
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
        <p className="text-xs text-muted-foreground">@{handle}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-6 mb-3 py-2">
        <div className="text-center">
          <div className="text-lg font-bold">{formatNumber(totals.following)}</div>
          <div className="text-xs text-muted-foreground">Following</div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="text-center">
          <div className="text-lg font-bold">{formatNumber(totals.followers)}</div>
          <div className="text-xs text-muted-foreground">Followers</div>
        </div>
        <div className="h-10 w-px bg-border" />
        <div className="text-center">
          <div className="text-lg font-bold">{formatNumber(totals.likes)}</div>
          <div className="text-xs text-muted-foreground">Likes</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center mb-2">
        <Button variant="secondary" size="sm" className="rounded-lg text-xs h-8">
          <span className="mr-1">+</span> Add bio
        </Button>
        <Button variant="secondary" size="sm" className="rounded-lg text-xs h-8">
          <span className="mr-1">+</span> Add school
        </Button>
        <Button variant="default" size="sm" className="rounded-lg text-xs h-8">
          Edit
        </Button>
      </div>

      {/* Link */}
      <div className="text-center mb-2">
        <a href="#" className="text-xs text-primary flex items-center justify-center gap-1">
          🔗 instagram.com/{handle}
        </a>
      </div>

      {/* Bottom actions */}
      <div className="flex justify-center gap-6 text-xs">
        <button className="flex items-center gap-1 text-primary">
          <span>👤</span> TikTok Studio
        </button>
        <button className="flex items-center gap-1 text-primary">
          <span>🛍️</span> Your orders
        </button>
        <button className="flex items-center gap-1 text-primary">
          <span>💼</span> Showcase
        </button>
      </div>
    </div>
  );
}
