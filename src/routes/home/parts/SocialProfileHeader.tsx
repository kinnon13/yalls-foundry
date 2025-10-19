import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth/context';
import { supabase } from '@/integrations/supabase/client';
import { Share2, Menu, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import profileAvatar from '@/assets/profile-avatar.jpg';

export default function SocialProfileHeader() {
  const { session } = useSession();
  const userId = session?.userId;
  const userEmail = session?.email;

  const [name, setName] = useState('User');
  const [handle, setHandle] = useState('username');
  const [avatar, setAvatar] = useState<string>(profileAvatar);
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
      if (prof?.avatar_url) {
        setAvatar(prof.avatar_url);
      }

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
    <div className="bg-background py-2 px-4 border-b">
      {/* Profile picture */}
      <div className="flex justify-center mb-2">
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/20">
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
          </div>
          <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">
            +
          </button>
        </div>
      </div>

      {/* Name and handle */}
      <div className="text-center mb-1">
        <div className="flex items-center justify-center gap-2 mb-0.5">
          <h1 className="text-base font-bold">{name}</h1>
          <span className="text-xs">▼</span>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
        </div>
        <p className="text-xs text-muted-foreground">@{handle}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 mb-2 py-1">
        <div className="text-center">
          <div className="text-sm font-bold">{formatNumber(totals.following)}</div>
          <div className="text-[10px] text-muted-foreground">Following</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <div className="text-sm font-bold">{formatNumber(totals.followers)}</div>
          <div className="text-[10px] text-muted-foreground">Followers</div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <div className="text-sm font-bold">{formatNumber(totals.likes)}</div>
          <div className="text-[10px] text-muted-foreground">Likes</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-1.5 justify-center mb-1.5">
        <Button variant="secondary" size="sm" className="rounded-lg text-[10px] h-6 px-2">
          <span className="mr-0.5">+</span> Add bio
        </Button>
        <Button variant="secondary" size="sm" className="rounded-lg text-[10px] h-6 px-2">
          <span className="mr-0.5">+</span> Add school
        </Button>
        <Button variant="default" size="sm" className="rounded-lg text-[10px] h-6 px-2">
          Edit
        </Button>
      </div>

      {/* Link */}
      <div className="text-center mb-1.5">
        <a href="#" className="text-[10px] text-primary flex items-center justify-center gap-1">
          🔗 instagram.com/{handle}
        </a>
      </div>

      {/* Bottom actions */}
      <div className="flex justify-center gap-4 text-[10px]">
        <button className="flex items-center gap-0.5 text-primary">
          <span className="text-xs">👤</span> TikTok Studio
        </button>
        <button className="flex items-center gap-0.5 text-primary">
          <span className="text-xs">🛍️</span> Your orders
        </button>
        <button className="flex items-center gap-0.5 text-primary">
          <span className="text-xs">💼</span> Showcase
        </button>
      </div>
    </div>
  );
}
