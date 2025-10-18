import AppsPane from './AppsPane';
import SocialFeedPane from './SocialFeedPane';
import { User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function PhonePager() {
  const pages = ['apps', 'feed', 'shop', 'profile'] as const;
  
  return (
    <div className="w-screen overflow-x-auto snap-x snap-mandatory flex no-scrollbar">
      {pages.map(key => (
        <section 
          key={key} 
          className="snap-start shrink-0 w-screen min-h-[calc(100vh-14rem)] px-3" 
          aria-label={key}
        >
          {key === 'apps' && <AppsPageMini />}
          {key === 'feed' && <FeedPageMini />}
          {key === 'shop' && <FeedPageMini />}
          {key === 'profile' && <ProfileMini />}
        </section>
      ))}
    </div>
  );
}

function AppsPageMini() {
  return (
    <div className="py-3">
      <AppsPane />
    </div>
  );
}

function FeedPageMini() {
  return (
    <div className="py-3">
      <SocialFeedPane />
    </div>
  );
}

function ProfileMini() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  return (
    <div className="py-3">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        <div>
          <div className="font-semibold text-lg">
            {userId ? 'Your Profile' : 'Guest'}
          </div>
          <div className="text-sm text-muted-foreground">
            0 Following · 0 Followers
          </div>
        </div>
        <div className="space-y-2">
          <button
            onClick={() => navigate('/profile')}
            className="w-full px-4 py-2 rounded-lg border border-border/60 hover:bg-accent/40 transition-colors"
          >
            View Full Profile
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full px-4 py-2 rounded-lg border border-border/60 hover:bg-accent/40 transition-colors"
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

