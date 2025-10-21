/**
 * Draggable App Grid - iOS/Mac style with free positioning
 */

import { useState, useEffect, useRef } from 'react';
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
  Target, Award, LucideIcon, FolderIcon, Network, Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppPins, type AppFolder } from '@/hooks/useAppPins';
import { FolderView } from './FolderView';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';

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
  mlm: { id: 'mlm', label: 'Network', icon: Network, module: 'mlm', color: 'from-emerald-500/20 to-green-600/5' },
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
  super_rocker: { id: 'super_rocker', label: 'Super Rocker', icon: Brain, route: '/super-rocker', color: 'from-purple-600/30 to-pink-600/10' },
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
  mlm: [4, 1],
  producers: [5, 1],
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
  super_rocker: [6, 3],
};

export function DraggableAppGrid() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openFolder, setOpenFolder] = useState<AppFolder | null>(null);
  const { isSuperAdmin } = useSuperAdminCheck();
  const [tileSize, setTileSize] = useState(() => 
    Number(localStorage.getItem('apps.tileSize') || 112)
  );
  
  // Apps grid measuring
  const appsGridRef = useRef<HTMLDivElement>(null);
  const [gridCols, setGridCols] = useState(8);
  const [rowGap, setRowGap] = useState(16);
  
  // Grid container position and size
  const [gridPosition, setGridPosition] = useState({ x: 20, y: 80 });
  const [gridSize, setGridSize] = useState({ 
    width: window.innerWidth - 600, 
    height: window.innerHeight - 200 
  });
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const [isResizingGrid, setIsResizingGrid] = useState<string | null>(null);
  const [dragStartGrid, setDragStartGrid] = useState({ x: 0, y: 0 });
  
  const { pins, folders, updatePosition, pinApp, createFolder } = useAppPins(userId);
  const [optimisticPins, setOptimisticPins] = useState<typeof pins>([]);

  useEffect(() => {
    localStorage.setItem('apps.tileSize', String(tileSize));
  }, [tileSize]);

  // Grid drag handlers
  const handleGridDragStart = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, .app-tile, .no-drag')) {
      return;
    }
    setIsDraggingGrid(true);
    setDragStartGrid({ x: e.clientX - gridPosition.x, y: e.clientY - gridPosition.y });
  };

  useEffect(() => {
    if (!isDraggingGrid) return;

    const handleGridDragMove = (e: MouseEvent) => {
      setGridPosition({
        x: Math.max(0, Math.min(e.clientX - dragStartGrid.x, window.innerWidth - gridSize.width)),
        y: Math.max(0, Math.min(e.clientY - dragStartGrid.y, window.innerHeight - gridSize.height))
      });
    };

    const handleGridDragEnd = () => setIsDraggingGrid(false);

    window.addEventListener('mousemove', handleGridDragMove);
    window.addEventListener('mouseup', handleGridDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleGridDragMove);
      window.removeEventListener('mouseup', handleGridDragEnd);
    };
  }, [isDraggingGrid, dragStartGrid, gridSize]);

  // Grid resize handlers
  const handleGridResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizingGrid(handle);
    setDragStartGrid({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!isResizingGrid) return;

    const handleGridResizeMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartGrid.x;
      const deltaY = e.clientY - dragStartGrid.y;

      setGridSize(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;
        let newX = gridPosition.x;
        let newY = gridPosition.y;

        if (isResizingGrid.includes('left')) {
          newWidth = Math.max(400, prev.width - deltaX);
          newX = gridPosition.x + deltaX;
        }
        if (isResizingGrid.includes('right')) {
          newWidth = Math.max(400, prev.width + deltaX);
        }
        if (isResizingGrid.includes('bottom')) {
          newHeight = Math.max(300, prev.height + deltaY);
        }
        if (isResizingGrid.includes('top')) {
          newHeight = Math.max(300, prev.height - deltaY);
          newY = gridPosition.y + deltaY;
        }

        setGridPosition(p => ({ ...p, x: newX, y: newY }));
        return { width: newWidth, height: newHeight };
      });

      setDragStartGrid({ x: e.clientX, y: e.clientY });
    };

    const handleGridResizeEnd = () => setIsResizingGrid(null);

    window.addEventListener('mousemove', handleGridResizeMove);
    window.addEventListener('mouseup', handleGridResizeEnd);

    return () => {
      window.removeEventListener('mousemove', handleGridResizeMove);
      window.removeEventListener('mouseup', handleGridResizeEnd);
    };
  }, [isResizingGrid, dragStartGrid, gridPosition]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2, // start dragging after 2px movement for snappier UX
      },
    })
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Observe grid size to compute columns and gap
  useEffect(() => {
    const el = appsGridRef.current;
    if (!el) return;

    const compute = () => {
      const style = getComputedStyle(el);
      const gap = parseInt(style.rowGap || '16', 10) || 16;
      setRowGap(gap);
      const cols = Math.max(1, Math.floor(el.clientWidth / (tileSize + gap)));
      setGridCols(cols);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tileSize, appsGridRef]);

  const normalizeId = (id: string) => id.startsWith('palette-') ? id.slice(8) : id;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active } = event;
    setActiveId(null);

    const container = document.querySelector('.pin-canvas') as HTMLElement | null;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const scroller = container.parentElement as HTMLElement | null;
    const scrollTop = scroller ? scroller.scrollTop : 0;

    const startX = (event as any).activatorEvent?.clientX ?? rect.left;
    const startY = (event as any).activatorEvent?.clientY ?? rect.top;
    const mouseX = startX + (event.delta?.x ?? 0);
    const mouseY = startY + (event.delta?.y ?? 0) + scrollTop;

    const cols = Math.max(1, gridCols);
    const cellWidth = rect.width / cols;
    const cellHeight = tileSize + rowGap;

    const gridX = Math.floor((mouseX - rect.left) / cellWidth);
    const gridY = Math.floor((mouseY - rect.top) / cellHeight);

    const rawId = active.id as string;
    const appId = rawId.startsWith('palette-') ? rawId.slice(8) : rawId;

    const existingPin = pins.find(p => p.app_id === appId);
    const maxX = Math.max(0, cols - 1);

    if (existingPin) {
      updatePosition.mutate({
        pinId: existingPin.id,
        x: Math.max(0, Math.min(maxX, gridX)),
        y: Math.max(0, gridY),
      });
    } else {
      pinApp.mutate({
        appId,
        x: Math.max(0, Math.min(maxX, gridX)),
        y: Math.max(0, gridY),
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
          "app-tile cursor-grab active:cursor-grabbing",
          !isDraggingThis && "hover:scale-105 active:scale-95",
          isDraggingThis && "opacity-50 scale-105 shadow-2xl ring-2 ring-primary"
        )}
        style={{ width: tileSize, height: tileSize }}
      >
        {isPinned && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background z-10" />
        )}
        {typeof index !== 'undefined' && (
          <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center border border-border shadow z-10">
            {index}
          </div>
        )}
        <div className="app-icon-wrap">
          <Icon className="w-full h-full text-white" strokeWidth={1.5} />
        </div>
        <div className="app-label" title={app.label}>
          {app.label}
        </div>
      </div>
    );
  };

  // Draggable app tile wrapper
  function DraggableApp({ app, index }: { app: AppTile; index: number }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
      id: `palette-${app.id}`,
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

  // Draggable pinned app overlay tile
  function DraggablePinnedApp({ app }: { app: AppTile }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: app.id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => !isDragging && handleAppClick(app)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-3xl"
      >
        {renderApp(app, isDragging || activeId === app.id)}
      </div>
    );
  }

  return (
    <>
      {/* Draggable & Resizable Grid Container */}
      <div
        className="fixed z-20 border-2 border-primary/30 rounded-xl bg-background/40 backdrop-blur shadow-2xl overflow-hidden"
        style={{
          left: `${gridPosition.x}px`,
          top: `${gridPosition.y}px`,
          width: `${gridSize.width}px`,
          height: `${gridSize.height}px`
        }}
      >
        {/* Drag Handle Bar - ONLY this area drags the container */}
        <div 
          className="px-4 py-2 bg-background/80 border-b border-border/40 cursor-move flex items-center justify-between"
          onMouseDown={handleGridDragStart}
        >
          <div className="text-xs text-muted-foreground">
            📱 Apps Grid • Drag here to move
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[10px] px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
              {gridSize.width}px × {gridSize.height}px
            </div>
          </div>
        </div>

        {/* Size Control */}
        <div className="px-4 py-3 flex items-center gap-3 bg-background/60 border-b border-border/40">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Tile size</label>
          <input
            type="range"
            min={88}
            max={160}
            step={4}
            value={tileSize}
            onChange={(e) => setTileSize(Number(e.target.value))}
            className="flex-1 max-w-xs"
          />
          <span className="text-xs text-muted-foreground w-12">{tileSize}px</span>
        </div>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={({ active }) => setActiveId(normalizeId(active.id as string))}
          onDragEnd={handleDragEnd}
        >
          <div className="relative w-full h-[calc(100%-108px)] overflow-auto">
            <div 
              className="pin-canvas relative max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 lg:py-16"
              style={{ '--tile': `${tileSize}px` } as React.CSSProperties}
            >
              <div className="apps-grid" ref={appsGridRef}>
                {Object.values(APPS)
                  .filter(app => app.id !== 'super_rocker' || isSuperAdmin)
                  .filter(app => !pins.some(p => p.app_id === app.id))
                  .map((app, idx) => (
                    <DraggableApp key={app.id} app={app} index={idx + 1} />
                  ))}
              </div>

            {/* Pinned overlay layer (absolute), aligns to 8-column grid, scrollable top-to-bottom */}
            <div className="absolute inset-0 pointer-events-none">
              {pins.map((pin) => {
                const app = APPS[pin.app_id];
                if (!app) return null;
                const leftPercent = (pin.grid_x / 8) * 100;
                return (
                  <div
                    key={pin.id}
                    className="absolute pointer-events-auto flex justify-center"
                    style={{ left: `${leftPercent}%`, width: 'calc(100% / 8)', top: `${pin.grid_y * 100}px` }}
                  >
                    <DraggablePinnedApp app={app} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId && APPS[activeId] ? renderApp(APPS[activeId], true) : null}
        </DragOverlay>
      </DndContext>

      {/* Resize Handles */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-blue-500/30 hover:bg-blue-500/50 transition-colors"
        onMouseDown={(e) => handleGridResizeStart(e, 'left')}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-green-500/30 hover:bg-green-500/50 transition-colors"
        onMouseDown={(e) => handleGridResizeStart(e, 'right')}
      />
      <div
        className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize bg-purple-500/30 hover:bg-purple-500/50 transition-colors"
        onMouseDown={(e) => handleGridResizeStart(e, 'bottom')}
      />
      <div
        className="absolute left-0 right-0 top-0 h-2 cursor-ns-resize bg-orange-500/30 hover:bg-orange-500/50 transition-colors"
        onMouseDown={(e) => handleGridResizeStart(e, 'top')}
      />
      <div
        className="absolute right-0 bottom-0 w-4 h-4 cursor-nwse-resize bg-red-500/40 hover:bg-red-500/60 transition-colors"
        onMouseDown={(e) => handleGridResizeStart(e, 'corner-rb')}
      />
      <div
        className="absolute left-0 bottom-0 w-4 h-4 cursor-nesw-resize bg-red-500/40 hover:bg-red-500/60 transition-colors"
        onMouseDown={(e) => handleGridResizeStart(e, 'corner-lb')}
      />
      <div
        className="absolute right-0 top-0 w-4 h-4 cursor-nesw-resize bg-red-500/40 hover:bg-red-500/60 transition-colors"
        onMouseDown={(e) => handleGridResizeStart(e, 'corner-rt')}
      />
      <div
        className="absolute left-0 top-0 w-4 h-4 cursor-nwse-resize bg-red-500/40 hover:bg-red-500/60 transition-colors"
        onMouseDown={(e) => handleGridResizeStart(e, 'corner-lt')}
      />
    </div>

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
