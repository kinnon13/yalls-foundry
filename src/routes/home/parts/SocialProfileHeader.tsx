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
    <div className="bg-background px-4 py-4 border-b">
      {/* Top row: Avatar + Stats */}
      <div className="flex items-start gap-4 mb-3">
        {/* Profile picture with gradient ring */}
        <div className="relative flex-shrink-0">
          <div 
            className="w-20 h-20 rounded-full p-[3px]"
            style={{
              background: 'linear-gradient(45deg, #f9ce34, #ee2a7b, #6228d7)',
            }}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-background p-[2px]">
              <img src={avatar} alt={name} className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
        </div>

        {/* Username + Stats */}
        <div className="flex-1 min-w-0">
          {/* Username with verified badge */}
          <div className="flex items-center gap-1.5 mb-3">
            <h1 className="text-base font-semibold">{handle}</h1>
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 40 40" fill="currentColor">
              <path d="M19.998.002C8.952.002 0 8.954 0 19.998s8.952 19.996 19.998 19.996 19.998-8.952 19.998-19.996S31.044.002 19.998.002zm10.292 14.866l-11.764 11.764c-.292.292-.678.438-1.061.438-.383 0-.77-.146-1.061-.438l-5.884-5.882c-.586-.586-.586-1.535 0-2.121.586-.586 1.535-.586 2.121 0l4.823 4.823 10.703-10.703c.586-.586 1.535-.586 2.121 0 .588.585.588 1.534.002 2.119z"/>
            </svg>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div>
              <span className="font-semibold text-sm">{formatNumber(totals.followers)}</span>
              <span className="text-xs text-muted-foreground ml-1">followers</span>
            </div>
            <div>
              <span className="font-semibold text-sm">{formatNumber(totals.following)}</span>
              <span className="text-xs text-muted-foreground ml-1">following</span>
            </div>
          </div>
        </div>
      </div>

      {/* Name + Bio */}
      <div className="text-sm space-y-1">
        <p className="font-semibold">{name}</p>
        <p className="text-foreground">utah | 📧 wecklesco@gmail.com</p>
        <p className="text-foreground">@{handle}</p>
      </div>
    </div>
  );
}
