import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { BarChart2, Pencil, Link2 } from 'lucide-react';

export default function MeHub() {
  const { session } = useSession();
  const userId = session?.userId ?? null;
  const [stats, setStats] = useState<{followers:number; following:number; likes:number; views:number} | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { data } = await supabase.rpc('get_user_aggregate_counts' as any, { p_user_id: userId });
        if (data) {
          setStats({ 
            followers: Number(data.followers_count ?? 0), 
            following: Number(data.following_count ?? 0), 
            likes: Number(data.likes_count ?? 0), 
            views: 0 
          });
        }
      } catch {
        setStats({ followers: 0, following: 0, likes: 0, views: 0 });
      }
    })();
  }, [userId]);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Profile</h1>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Followers" value={stats?.followers ?? 0}/>
        <Stat label="Following" value={stats?.following ?? 0}/>
        <Stat label="Likes" value={stats?.likes ?? 0}/>
        <Stat label="Views" value={stats?.views ?? 0}/>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList>
          <TabsTrigger value="analytics"><BarChart2 className="w-4 h-4 mr-2"/>Analytics</TabsTrigger>
          <TabsTrigger value="edit"><Pencil className="w-4 h-4 mr-2"/>Edit Profile</TabsTrigger>
          <TabsTrigger value="links"><Link2 className="w-4 h-4 mr-2"/>Links</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-4">
          {/* Replace with your analytics components */}
          <div className="rounded-lg border bg-card p-4">Analytics dashboards go here.</div>
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          {/* Replace with your edit form (name, handle, avatar, bio, theme, etc.) */}
          <div className="rounded-lg border bg-card p-4">Profile edit form here.</div>
        </TabsContent>

        <TabsContent value="links" className="mt-4">
          {/* Link-out settings (website, socials), deep-link QR, etc. */}
          <div className="rounded-lg border bg-card p-4">Manage links & website redirect here.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({label, value}:{label:string; value:number}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
