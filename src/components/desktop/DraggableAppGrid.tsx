/**
 * Draggable App Grid - iOS/Mac style with free positioning
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DndContext, 
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  useDraggable
} from '@dnd-kit/core';
import { 
  Calendar, Settings, DollarSign, Trophy, ShoppingCart,
  Building, Users, Sparkles, Tractor, CheckCircle,
  MessageSquare, LayoutDashboard, User, MapPin, 
  Flame, BookOpen, Home, Store, Activity, Zap,
  Target, Award, LucideIcon, FolderIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppPins, type AppFolder } from '@/hooks/useAppPins';
import { FolderView } from './FolderView';
import { supabase } from '@/integrations/supabase/client';

interface AppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  module?: string;
  color?: string;
}

const APPS: Record<string, AppTile> = {
  home: { id: 'home', label: 'Home', icon: Home, module: 'overview', color: 'from-blue-500/20 to-blue-600/5' },
  profile: { id: 'profile', label: 'Profile', icon: User, route: '/profile', color: 'from-purple-500/20 to-purple-600/5' },
  social: { id: 'social', label: 'Four', icon: Flame, route: '/social', color: 'from-orange-500/20 to-red-600/5' },
  marketplace: { id: 'marketplace', label: 'Market', icon: Store, route: '/marketplace', color: 'from-green-500/20 to-emerald-600/5' },
  messages: { id: 'messages', label: 'Messages', icon: MessageSquare, module: 'messages', color: 'from-cyan-500/20 to-blue-600/5' },
  calendar: { id: 'calendar', label: 'Calendar', icon: Calendar, module: 'events', color: 'from-red-500/20 to-orange-600/5' },
  earnings: { id: 'earnings', label: 'Earnings', icon: DollarSign, module: 'earnings', color: 'from-green-500/20 to-teal-600/5' },
  orders: { id: 'orders', label: 'Orders', icon: ShoppingCart, module: 'orders', color: 'from-blue-500/20 to-indigo-600/5' },
  business: { id: 'business', label: 'Business', icon: Building, module: 'business', color: 'from-gray-500/20 to-slate-600/5' },
  producers: { id: 'producers', label: 'Producers', icon: Users, module: 'producers', color: 'from-purple-500/20 to-fuchsia-600/5' },
  stallions: { id: 'stallions', label: 'Stallions', icon: Sparkles, module: 'stallions', color: 'from-amber-500/20 to-yellow-600/5' },
  farm_ops: { id: 'farm_ops', label: 'Farm Ops', icon: Tractor, module: 'farm_ops', color: 'from-lime-500/20 to-green-600/5' },
  incentives: { id: 'incentives', label: 'Incentives', icon: Trophy, module: 'incentives', color: 'from-yellow-500/20 to-amber-600/5' },
  approvals: { id: 'approvals', label: 'Approvals', icon: CheckCircle, module: 'approvals', color: 'from-teal-500/20 to-cyan-600/5' },
  activity: { id: 'activity', label: 'Activity', icon: Activity, route: '/activity', color: 'from-pink-500/20 to-rose-600/5' },
  discover: { id: 'discover', label: 'Discover', icon: Zap, route: '/discover', color: 'from-violet-500/20 to-purple-600/5' },
  map: { id: 'map', label: 'Map', icon: MapPin, route: '/map', color: 'from-emerald-500/20 to-green-600/5' },
  page: { id: 'page', label: 'Page', icon: BookOpen, route: '/page', color: 'from-orange-500/20 to-amber-600/5' },
  goals: { id: 'goals', label: 'Goals', icon: Target, route: '/goals', color: 'from-indigo-500/20 to-blue-600/5' },
  awards: { id: 'awards', label: 'Awards', icon: Award, route: '/awards', color: 'from-rose-500/20 to-pink-600/5' },
  settings: { id: 'settings', label: 'Settings', icon: Settings, module: 'settings', color: 'from-slate-500/20 to-gray-600/5' },
};

// Default grid layout (8 cols × unlimited rows)
const DEFAULT_POSITIONS: Record<string, [number, number]> = {
  home: [0, 0],
  profile: [1, 0],
  social: [2, 0],
  marketplace: [3, 0],
  messages: [4, 0],
  calendar: [0, 1],
  earnings: [1, 1],
  orders: [2, 1],
  business: [3, 1],
  producers: [4, 1],
  stallions: [0, 2],
  farm_ops: [1, 2],
  incentives: [2, 2],
  approvals: [3, 2],
  activity: [4, 2],
  discover: [0, 3],
  map: [1, 3],
  page: [2, 3],
  goals: [3, 3],
  awards: [4, 3],
  settings: [5, 3],
};

export function DraggableAppGrid() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<AppFolder | null>(null);
  
  const { pins, folders, updatePosition, pinApp, createFolder } = useAppPins(userId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    setActiveId(null);

    // Get the container's bounding rect to calculate grid position
    const container = document.querySelector('.pin-canvas');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const startX = (event as any).activatorEvent?.clientX ?? rect.left;
    const startY = (event as any).activatorEvent?.clientY ?? rect.top;
    const mouseX = startX + (event.delta?.x ?? 0);
    const mouseY = startY + (event.delta?.y ?? 0);
    
    // Calculate which grid cell the drop happened in
    const cellWidth = rect.width / 8; // 8 columns
    const cellHeight = 100; // approximate cell height
    const gridX = Math.floor((mouseX - rect.left) / cellWidth);
    const gridY = Math.floor((mouseY - rect.top) / cellHeight);

    // Find if this app is already pinned
    const existingPin = pins.find(p => p.app_id === active.id);
    
    if (existingPin) {
      // Update existing pin position
      updatePosition.mutate({
        pinId: existingPin.id,
        x: Math.max(0, Math.min(7, gridX)),
        y: Math.max(0, gridY), // No max limit on Y
      });
    } else {
      // Create new pin at this position
      pinApp.mutate({
        appId: active.id as string,
        x: Math.max(0, Math.min(7, gridX)),
        y: Math.max(0, gridY), // No max limit on Y
      });
    }
  };

  const handleAppClick = (app: AppTile) => {
    if (app.route) {
      navigate(app.route);
    } else if (app.module) {
      navigate(`/dashboard?m=${app.module}`);
    }
  };

  const renderApp = (app: AppTile, isDraggingThis?: boolean, index?: number) => {
    const Icon = app.icon;
    const isPinned = pins.some(p => p.app_id === app.id);
    
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 relative",
          "rounded-2xl sm:rounded-3xl transition-all duration-200",
          !isDraggingThis && "hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing",
          isDraggingThis && "opacity-50"
        )}
      >
        {isPinned && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background z-10" />
        )}
        {typeof index !== 'undefined' && (
          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center border border-border shadow z-10">
            {index}
          </div>
        )}
        <div className={cn(
          "relative flex items-center justify-center shadow-lg",
          `bg-gradient-to-br ${app.color || 'from-primary/20 to-primary/5'}`,
          "border border-white/10",
          "w-14 h-14 rounded-[18px] sm:w-16 sm:h-16 sm:rounded-[20px]",
          "md:w-[72px] md:h-[72px] md:rounded-[21px]",
          "lg:w-20 lg:h-20 lg:rounded-[22px]",
          "xl:w-[88px] xl:h-[88px] xl:rounded-[24px]"
        )}>
          <Icon 
            className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 xl:w-11 xl:h-11 text-white drop-shadow-sm"
            strokeWidth={1.5} 
          />
        </div>
        <span className="text-[10px] sm:text-[11px] md:text-xs font-medium text-foreground/90 text-center leading-tight truncate max-w-[56px] sm:max-w-[64px] md:max-w-[72px] lg:max-w-[80px] xl:max-w-[88px]">
          {app.label}
        </span>
      </div>
    );
  };

  // Draggable app tile wrapper
  function DraggableApp({ app, index }: { app: AppTile; index: number }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: app.id,
    });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
      : undefined;

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => !isDragging && handleAppClick(app)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-3xl"
      >
        {renderApp(app, isDragging || activeId === app.id, index)}
      </div>
    );
  }

  return (
    <>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={({ active }) => setActiveId(active.id as string)}
        onDragEnd={handleDragEnd}
      >
        <div className="relative z-20 w-full min-h-[600vh] overflow-auto">
          <div className="pin-canvas relative outline-dashed outline-1 outline-primary/30 max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-16 min-h-[600vh]">
            <div className="absolute top-2 left-4 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Pin area</div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-4 sm:gap-6 md:gap-7 lg:gap-8">
              {Object.values(APPS).map((app, idx) => (
                <DraggableApp key={app.id} app={app} index={idx + 1} />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && APPS[activeId] ? renderApp(APPS[activeId], true) : null}
        </DragOverlay>
      </DndContext>

      {openFolder && (
        <FolderView
          folder={openFolder}
          onClose={() => setOpenFolder(null)}
          onAppClick={(appId) => {
            const app = APPS[appId];
            if (app) handleAppClick(app);
          }}
        />
      )}
    </>
  );
}
