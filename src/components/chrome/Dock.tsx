/**
 * Dock - Mac-style bottom bar with pinned apps
 */

import { useOpenApp } from '@/lib/nav/useOpenApp';
import type { OverlayKey } from '@/lib/overlay/types';
import { MessageSquare, ShoppingBag, Calendar, Users, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreateButton } from '@/components/dock/CreateButton';

const DOCK_APPS_LEFT: Array<{ id: OverlayKey; icon: any; label: string }> = [
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
  { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace' },
];

const DOCK_APPS_RIGHT: Array<{ id: OverlayKey; icon: any; label: string }> = [
  { id: 'events', icon: Calendar, label: 'Events' },
  { id: 'orders', icon: Users, label: 'Orders' },
];

export default function Dock({ onAppClick }: { onAppClick: (id: OverlayKey) => void }) {
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

  const handleRockerClick = () => {
    // Navigate to rocker/AI assistant
    window.dispatchEvent(new CustomEvent('open-rocker'));
  };

  return (
    <nav aria-label="Bottom dock" className="dock">
      {/* Profile Picture - First item */}
      {profile && (
        <button
          className="dock-icon dock-profile"
          onClick={handleProfileClick}
          title="Profile"
        >
          <img 
            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`} 
            alt={profile.display_name || 'Profile'} 
            className="w-full h-full object-cover rounded-full"
          />
        </button>
      )}
      
      {/* Left side apps */}
      {DOCK_APPS_LEFT.map(app => {
        const Icon = app.icon;
        return (
          <button
            key={app.id}
            className="dock-icon"
            onClick={() => onAppClick(app.id)}
            title={app.label}
          >
            <Icon />
          </button>
        );
      })}

      {/* Center Create Button */}
      <CreateButton />

      {/* Right side apps */}
      {DOCK_APPS_RIGHT.map(app => {
        const Icon = app.icon;
        return (
          <button
            key={app.id}
            className="dock-icon"
            onClick={() => onAppClick(app.id)}
            title={app.label}
          >
            <Icon />
          </button>
        );
      })}

      {/* Rocker Icon - Last item */}
      <button
        className="dock-icon dock-rocker"
        onClick={handleRockerClick}
        title="Rocker AI"
      >
        <Zap className="w-7 h-7" />
      </button>
    </nav>
  );
}
