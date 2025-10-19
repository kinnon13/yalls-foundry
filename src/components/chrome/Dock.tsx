/**
 * Dock - Mac-style bottom bar with pinned apps
 * Pulls apps from central registry
 */

import { useState } from 'react';
import type { OverlayKey } from '@/lib/overlay/types';
import { Users, Brain } from 'lucide-react';
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

export default function Dock({ onAppClick }: { onAppClick: (id: OverlayKey) => void }) {
  const { setIsOpen } = useRockerGlobal();
  const { pinnedApps, unpinApp, reorderApps } = usePinnedApps();
  const [isEditMode, setIsEditMode] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5,
      },
    }),
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

  const handleDragStart = () => {
    setIsEditMode(true);
  };

  const handleProfileClick = () => {
    if (!isEditMode) {
      window.dispatchEvent(new CustomEvent('navigate-profile'));
    }
  };

  const handleRockerClick = () => {
    if (!isEditMode) {
      setIsOpen(true);
    }
  };

  return (
    <>
      {isEditMode && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <button
            onClick={() => setIsEditMode(false)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg pointer-events-auto hover:scale-105 transition-transform"
          >
            Done
          </button>
        </div>
      )}
      <nav 
        aria-label="Bottom dock" 
        className="dock relative z-50"
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
          onDragStart={handleDragStart}
        >
          <SortableContext
            items={pinnedApps.map(app => app.id)}
            strategy={horizontalListSortingStrategy}
          >
            {pinnedApps.map(app => (
              <DockApp
                key={app.id}
                app={app}
                Icon={app.icon}
                isEditMode={isEditMode}
                onClick={() => !isEditMode && onAppClick(app.id)}
                onRemove={() => unpinApp(app.id)}
              />
            ))}
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
