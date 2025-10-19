/**
 * Dock - Mac-style bottom bar with pinned apps
 */

import { useOpenApp } from '@/lib/nav/useOpenApp';
import type { OverlayKey } from '@/lib/overlay/types';
import { 
  MessageSquare, ShoppingBag, Calendar, Users, Brain, Package, 
  DollarSign, Bell, Heart, LucideIcon, ShoppingCart, Store, 
  Sparkles, BarChart3, Video, User, Settings 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CreateButton } from '@/components/dock/CreateButton';
import { useRockerGlobal } from '@/lib/ai/rocker';
import { usePinnedApps } from '@/hooks/usePinnedApps';

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare,
  ShoppingBag,
  Calendar,
  Users,
  Package,
  DollarSign,
  Bell,
  Heart,
  ShoppingCart,
  Store,
  Sparkles,
  BarChart3,
  Video,
  User,
  Settings,
};

export default function Dock({ onAppClick }: { onAppClick: (id: OverlayKey) => void }) {
  const { setIsOpen } = useRockerGlobal();
  const { pinnedApps } = usePinnedApps();
  
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
    setIsOpen(true);
  };

  return (
    <nav aria-label="Bottom dock" className="dock">
      {/* Profile Picture - First item - Always visible */}
      <button
        className="dock-icon dock-profile"
        onClick={handleProfileClick}
        title="Profile"
      >
        {profile ? (
          <img 
            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`} 
            alt={profile.display_name || 'Profile'} 
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <Users className="w-7 h-7" />
        )}
      </button>
      
      {/* Pinned apps */}
      {pinnedApps.map(app => {
        const Icon = ICON_MAP[app.icon] || MessageSquare;
        return (
          <button
            key={app.id}
            className="dock-icon relative"
            onClick={() => onAppClick(app.id as OverlayKey)}
            title={app.label}
          >
            <div className={`w-full h-full rounded-[24%] bg-gradient-to-br ${app.gradient} flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] border border-white/10`}>
              <Icon className={`w-7 h-7 drop-shadow-lg ${app.color}`} strokeWidth={1.75} />
              <div className="absolute inset-0 rounded-[24%] bg-gradient-to-t from-white/5 to-transparent opacity-50" />
            </div>
          </button>
        );
      })}

      {/* Center Create Button */}
      <CreateButton />

      {/* Rocker Icon - Last item */}
      <button
        className="dock-icon"
        onClick={handleRockerClick}
        title="Rocker AI"
      >
        <Brain />
      </button>
    </nav>
  );
}
