/**
 * Dock - Mac-style bottom bar with pinned apps
 */

import { useState, useRef } from 'react';
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
import { DockApp } from './DockApp';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

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
  const { pinnedApps, unpinApp, reorderApps } = usePinnedApps();
  const [isEditMode, setIsEditMode] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = pinnedApps.findIndex(app => app.id === active.id);
      const newIndex = pinnedApps.findIndex(app => app.id === over.id);
      reorderApps(arrayMove(pinnedApps, oldIndex, newIndex));
    }
  };

  const handleLongPress = () => {
    setIsEditMode(true);
  };

  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(handleLongPress, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleProfileClick = () => {
    window.dispatchEvent(new CustomEvent('navigate-profile'));
  };

  const handleRockerClick = () => {
    setIsOpen(true);
  };

  // Exit edit mode when clicking outside
  const handleBackgroundClick = () => {
    if (isEditMode) {
      setIsEditMode(false);
    }
  };

  return (
    <>
      {isEditMode && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={handleBackgroundClick}
        />
      )}
      <nav 
        aria-label="Bottom dock" 
        className="dock relative z-50"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
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
        
        {/* Pinned apps with drag and drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={pinnedApps.map(app => app.id)}
            strategy={horizontalListSortingStrategy}
          >
            {pinnedApps.map(app => {
              const Icon = ICON_MAP[app.icon] || MessageSquare;
              return (
                <DockApp
                  key={app.id}
                  app={app}
                  Icon={Icon}
                  isEditMode={isEditMode}
                  onClick={() => !isEditMode && onAppClick(app.id as OverlayKey)}
                  onRemove={() => unpinApp(app.id)}
                />
              );
            })}
          </SortableContext>
        </DndContext>

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
    </>
  );
}
