/**
 * Global Header - Mac-style top bar
 */

import { Users, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logout as canonicalLogout } from '@/lib/auth/logout';
import { Button } from '@/components/ui/button';

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

  const handleLogout = async () => {
    try {
      await canonicalLogout('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="header">
      {/* Profile Picture - Left side before brand */}
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

      <div className="brand">Y'alls.Ai</div>

      <input 
        className="search" 
        placeholder="Search people, businesses, apps…" 
        type="search"
      />

      {/* Logout Button */}
      <Button
        onClick={handleLogout}
        variant="ghost"
        size="sm"
        className="gap-2 ml-auto"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden md:inline">Logout</span>
      </Button>
    </header>
  );
}
