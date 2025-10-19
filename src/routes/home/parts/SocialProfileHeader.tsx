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
  const [profileViews] = useState(6);

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
    <div className="bg-background py-4 px-4 border-b">
      {/* Top bar - icons */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <UserPlus className="w-6 h-6" />
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-lg">📱</span>
          </div>
        </div>
        
        {profileViews > 0 && (
          <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2">
            <span className="text-sm font-medium">{profileViews} profile views</span>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-primary/30 border-2 border-background" />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6" />
          <Menu className="w-6 h-6" />
        </div>
      </div>

      {/* Profile picture */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden ring-2 ring-primary/20">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-4xl">
                👤
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl">
            +
          </button>
        </div>
      </div>

      {/* Name and handle */}
      <div className="text-center mb-1">
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-2xl font-bold">{name}</h1>
          <span className="text-sm">▼</span>
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
        <p className="text-sm text-muted-foreground">@{handle}</p>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-8 mb-6 py-4">
        <div className="text-center">
          <div className="text-xl font-bold">{formatNumber(totals.following)}</div>
          <div className="text-sm text-muted-foreground">Following</div>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="text-center">
          <div className="text-xl font-bold">{formatNumber(totals.followers)}</div>
          <div className="text-sm text-muted-foreground">Followers</div>
        </div>
        <div className="h-12 w-px bg-border" />
        <div className="text-center">
          <div className="text-xl font-bold">{formatNumber(totals.likes)}</div>
          <div className="text-sm text-muted-foreground">Likes</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 justify-center mb-4">
        <Button variant="secondary" size="sm" className="rounded-lg">
          <span className="text-lg mr-1">+</span> Add bio
        </Button>
        <Button variant="secondary" size="sm" className="rounded-lg">
          <span className="text-lg mr-1">+</span> Add school
        </Button>
        <Button variant="default" size="sm" className="rounded-lg">
          Edit
        </Button>
      </div>

      {/* Link */}
      <div className="text-center mb-4">
        <a href="#" className="text-sm text-primary flex items-center justify-center gap-2">
          🔗 instagram.com/{handle}
        </a>
      </div>

      {/* Bottom actions */}
      <div className="flex justify-center gap-8 text-sm">
        <button className="flex items-center gap-2 text-primary">
          <span className="text-lg">👤</span> TikTok Studio
        </button>
        <button className="flex items-center gap-2 text-primary">
          <span className="text-lg">🛍️</span> Your orders
        </button>
        <button className="flex items-center gap-2 text-primary">
          <span className="text-lg">💼</span> Showcase
        </button>
      </div>
    </div>
  );
}
