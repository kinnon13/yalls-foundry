/**
 * Global Header - Mac-style top bar
 */

import { Users, Brain } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function HeaderBar() {
  // Fetch current user profile
  const { data: profile } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      return data;
    }
  });

  const handleProfileClick = () => {
    window.dispatchEvent(new CustomEvent('navigate-profile'));
  };

  return (
    <header className="header">
      <div className="brand">Y'alls.Ai</div>

      <input 
        className="search" 
        placeholder="Search people, businesses, apps…" 
        type="search"
      />

      {/* Profile and AI icons on the right */}
      <div className="flex items-center gap-3">
        {/* Profile Picture */}
        <button
          onClick={handleProfileClick}
          className="w-10 h-10 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
          title="Profile"
        >
          {profile ? (
            <img 
              src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`} 
              alt={profile.display_name || 'Profile'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          )}
        </button>

        {/* AI Icon placeholder */}
        <button
          className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center hover:scale-105 transition-transform"
          title="AI Assistant"
        >
          <Brain className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>
    </header>
  );
}
