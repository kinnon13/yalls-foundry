import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoritesBar } from '@/components/social/FavoritesBar';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfilePins } from '@/hooks/useProfilePins';

import { useEntityCapabilities } from '@/hooks/useEntityCapabilities';
import { 
  Calendar, Settings, DollarSign, Trophy, ShoppingCart,
  Building, Users, Sparkles, Tractor, CheckCircle,
  MessageSquare, User, MapPin, Flame, BookOpen, 
  Store, Activity, Zap, Target, Award, LucideIcon, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppTile {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string;
  module?: string;
  color?: string;
  requireKind?: 'business' | 'farm' | 'horse' | 'stallion' | 'producer' | 'incentive';
}

// Consumer apps - always visible
const CONSUMER_APPS: AppTile[] = [
  { id: 'me', label: 'My Profile', icon: User, route: '/me', color: 'from-purple-500/20 to-purple-600/5' },
  { id: 'social', label: 'Four', icon: Flame, route: '/social', color: 'from-orange-500/20 to-red-600/5' },
  { id: 'marketplace', label: 'Market', icon: Store, route: '/marketplace', color: 'from-green-500/20 to-emerald-600/5' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, module: 'messages', color: 'from-cyan-500/20 to-blue-600/5' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, module: 'events', color: 'from-red-500/20 to-orange-600/5' },
  { id: 'activity', label: 'Activity', icon: Activity, route: '/activity', color: 'from-pink-500/20 to-rose-600/5' },
  { id: 'discover', label: 'Discover', icon: Zap, route: '/discover', color: 'from-violet-500/20 to-purple-600/5' },
  { id: 'map', label: 'Map', icon: MapPin, route: '/map', color: 'from-emerald-500/20 to-green-600/5' },
  { id: 'page', label: 'Page', icon: BookOpen, route: '/page', color: 'from-orange-500/20 to-amber-600/5' },
  { id: 'goals', label: 'Goals', icon: Target, route: '/goals', color: 'from-indigo-500/20 to-blue-600/5' },
  { id: 'awards', label: 'Awards', icon: Award, route: '/awards', color: 'from-rose-500/20 to-pink-600/5' },
  { id: 'settings', label: 'Settings', icon: Settings, module: 'settings', color: 'from-slate-500/20 to-gray-600/5' },
  // Test boxes for pagination
  { id: 'test1', label: 'Test 1', icon: Plus, route: '/test1', color: 'from-red-500/20 to-red-600/5' },
  { id: 'test2', label: 'Test 2', icon: Plus, route: '/test2', color: 'from-blue-500/20 to-blue-600/5' },
  { id: 'test3', label: 'Test 3', icon: Plus, route: '/test3', color: 'from-green-500/20 to-green-600/5' },
  { id: 'test4', label: 'Test 4', icon: Plus, route: '/test4', color: 'from-yellow-500/20 to-yellow-600/5' },
  { id: 'test5', label: 'Test 5', icon: Plus, route: '/test5', color: 'from-purple-500/20 to-purple-600/5' },
  { id: 'test6', label: 'Test 6', icon: Plus, route: '/test6', color: 'from-pink-500/20 to-pink-600/5' },
  { id: 'test7', label: 'Test 7', icon: Plus, route: '/test7', color: 'from-indigo-500/20 to-indigo-600/5' },
  { id: 'test8', label: 'Test 8', icon: Plus, route: '/test8', color: 'from-cyan-500/20 to-cyan-600/5' },
  { id: 'test9', label: 'Test 9', icon: Plus, route: '/test9', color: 'from-teal-500/20 to-teal-600/5' },
  { id: 'test10', label: 'Test 10', icon: Plus, route: '/test10', color: 'from-lime-500/20 to-lime-600/5' },
  { id: 'test11', label: 'Test 11', icon: Plus, route: '/test11', color: 'from-orange-500/20 to-orange-600/5' },
  { id: 'test12', label: 'Test 12', icon: Plus, route: '/test12', color: 'from-rose-500/20 to-rose-600/5' },
  { id: 'test13', label: 'Test 13', icon: Plus, route: '/test13', color: 'from-violet-500/20 to-violet-600/5' },
  { id: 'test14', label: 'Test 14', icon: Plus, route: '/test14', color: 'from-fuchsia-500/20 to-fuchsia-600/5' },
  { id: 'test15', label: 'Test 15', icon: Plus, route: '/test15', color: 'from-amber-500/20 to-amber-600/5' },
  { id: 'test16', label: 'Test 16', icon: Plus, route: '/test16', color: 'from-emerald-500/20 to-emerald-600/5' },
  { id: 'test17', label: 'Test 17', icon: Plus, route: '/test17', color: 'from-sky-500/20 to-sky-600/5' },
  { id: 'test18', label: 'Test 18', icon: Plus, route: '/test18', color: 'from-red-500/20 to-red-600/5' },
  { id: 'test19', label: 'Test 19', icon: Plus, route: '/test19', color: 'from-blue-500/20 to-blue-600/5' },
  { id: 'test20', label: 'Test 20', icon: Plus, route: '/test20', color: 'from-green-500/20 to-green-600/5' },
];

// Management apps - only visible if user owns relevant entity type
const MANAGEMENT_APPS: AppTile[] = [
  { id: 'business', label: 'Business', icon: Building, module: 'business', color: 'from-gray-500/20 to-slate-600/5', requireKind: 'business' },
  { id: 'farm_ops', label: 'Farm', icon: Tractor, module: 'farm_ops', color: 'from-lime-500/20 to-green-600/5', requireKind: 'farm' },
  { id: 'producers', label: 'Producers', icon: Users, module: 'producers', color: 'from-purple-500/20 to-fuchsia-600/5', requireKind: 'producer' },
  { id: 'stallions', label: 'Stallions', icon: Sparkles, module: 'stallions', color: 'from-amber-500/20 to-yellow-600/5', requireKind: 'stallion' },
  { id: 'incentives', label: 'Incentives', icon: Trophy, module: 'incentives', color: 'from-yellow-500/20 to-amber-600/5', requireKind: 'incentive' },
  { id: 'earnings', label: 'Earnings', icon: DollarSign, module: 'earnings', color: 'from-green-500/20 to-teal-600/5' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, module: 'orders', color: 'from-blue-500/20 to-indigo-600/5' },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle, module: 'approvals', color: 'from-teal-500/20 to-cyan-600/5' },
];

export default function AppsPane() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [tile, setTile] = useState(() => 
    Number(localStorage.getItem('apps.tileSize') || 112)
  );
  const [containerHeight, setContainerHeight] = useState(() => 
    Number(localStorage.getItem('apps.containerHeight') || 400)
  );
  const [containerWidth, setContainerWidth] = useState(() => 
    Number(localStorage.getItem('apps.containerWidth') || 600)
  );
  const [containerX, setContainerX] = useState(() => 
    Number(localStorage.getItem('apps.containerX') || 0)
  );
  const [containerY, setContainerY] = useState(() => 
    Number(localStorage.getItem('apps.containerY') || 0)
  );
  const [currentPage, setCurrentPage] = useState(0);
  
  // App overlay state
  const [openApp, setOpenApp] = useState<AppTile | null>(null);

  useEffect(() => {
    localStorage.setItem('apps.tileSize', String(tile));
  }, [tile]);

  useEffect(() => {
    localStorage.setItem('apps.containerHeight', String(containerHeight));
  }, [containerHeight]);

  useEffect(() => {
    localStorage.setItem('apps.containerWidth', String(containerWidth));
  }, [containerWidth]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Observe box resize to update pagination + persist size
  const boxRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!boxRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const w = Math.round(el.offsetWidth);
        const h = Math.round(el.offsetHeight);
        setContainerWidth(w);
        setContainerHeight(h);
        localStorage.setItem('apps.containerWidth', String(w));
        localStorage.setItem('apps.containerHeight', String(h));
      }
    });
    obs.observe(boxRef.current);
    return () => obs.disconnect();
  }, []);
  // Get entity capabilities
  const { data: capabilities = {} } = useEntityCapabilities(userId);

  // Fetch pinned entities
  const pins = useProfilePins(userId);

  const { data: pinnedEntities } = useQuery({
    queryKey: ['pinned-entities', userId, pins.data],
    queryFn: async () => {
      if (!pins.data) return { entities: [], ghostPins: [] };
      const entityPins = pins.data.filter(p => p.pin_type === 'entity');
      if (entityPins.length === 0) return { entities: [], ghostPins: [] };

      const entityIds = entityPins.map(p => p.ref_id);
      
      // Chunk large IN queries (100 IDs per chunk)
      const chunk = <T,>(arr: T[], n = 100): T[][] => 
        Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => 
          arr.slice(i * n, (i + 1) * n)
        );
      
      const results = await Promise.all(
        chunk(entityIds, 100).map(ids =>
          supabase
            .from('entities')
            .select('id, display_name, kind, status, handle, owner_user_id')
            .in('id', ids)
        )
      );

      const entities = results.flatMap(r => r.data ?? []);
      
      // Track ghost pins (pins pointing to deleted entities)
      const foundIds = new Set(entities.map(e => e.id));
      const ghostPins = entityPins.filter(p => !foundIds.has(p.ref_id));
      
      return { entities, ghostPins };
    },
    enabled: !!userId && !!pins.data && pins.data.length > 0
  });

  // Filter management apps based on capabilities
  const filteredManagementApps = useMemo(() => {
    return MANAGEMENT_APPS.filter(app => {
      // If app requires a specific entity kind, check if user has it
      if (app.requireKind) {
        return (capabilities[app.requireKind] ?? 0) > 0;
      }
      // Otherwise show the app (e.g., earnings, orders, approvals)
      return true;
    });
  }, [capabilities]);

  // Show "Create Profile" tile if user has no managed entities
  const hasNoManagedEntities = useMemo(() => {
    const totalEntities = Object.values(capabilities).reduce((sum, count) => sum + count, 0);
    return totalEntities === 0;
  }, [capabilities]);

  // Combine all visible apps + pinned entities
  const visibleApps = useMemo(() => {
    const apps = [...CONSUMER_APPS];
    
    // Add "Create Profile" tile after Profile if user has no entities
    if (hasNoManagedEntities) {
      const createProfileTile: AppTile = {
        id: 'create-profile',
        label: 'Create Profile',
        icon: Plus,
        route: '/profiles/new',
        color: 'from-primary/30 to-primary/10',
      };
      // Insert after Profile (index 1)
      apps.splice(2, 0, createProfileTile);
    }
    
    // Add filtered management apps
    apps.push(...filteredManagementApps);
    
    return apps;
  }, [hasNoManagedEntities, filteredManagementApps]);

  // All items (apps + pinned entities + ghost pins)
  const allItems = useMemo(() => {
    const items = [...visibleApps];
    
    // Add pinned entities
    (pinnedEntities?.entities || []).forEach((entity: any) => {
      const route = entity.owner_user_id === userId 
        ? `/workspace/${entity.id}/dashboard` 
        : `/entities/${entity.id}`;
      
      items.push({
        id: `entity:${entity.id}`,
        label: entity.display_name,
        icon: Building,
        route,
        color: entity.status === 'unclaimed' ? 'from-amber-500/20 to-amber-500/5' : 'from-accent/20 to-accent/5',
      });
    });
    
    // Add ghost pins (deleted entities) - these won't navigate but user can see them
    (pinnedEntities?.ghostPins || []).forEach((pin: any) => {
      items.push({
        id: `ghost:${pin.ref_id}`,
        label: pin.title || 'Deleted Item',
        icon: Building,
        route: undefined,
        color: 'from-muted/20 to-muted/5',
      });
    });
    
    console.log('Total apps:', items.length, 'Consumer:', CONSUMER_APPS.length, 'Pinned:', pinnedEntities?.entities?.length || 0);
    return items;
  }, [visibleApps, pinnedEntities, userId]);

  // Grid dimensions derived from resizable box (subtract border only: border-2=2px each side => 4px total)
  const gridDims = useMemo(() => {
    const innerW = Math.max(0, containerWidth - 4);
    const innerH = Math.max(0, containerHeight - 4);
    const cols = Math.max(1, Math.floor(innerW / (tile + 4))); // 4px gap
    const rows = Math.max(1, Math.floor(innerH / (tile + 4)));
    return { cols, rows };
  }, [containerWidth, containerHeight, tile]);

  // Items per page = cols * rows in the current box
  const itemsPerPage = useMemo(() => {
    return gridDims.cols * gridDims.rows;
  }, [gridDims]);

  // Calculate total pages
  const totalPages = Math.ceil(allItems.length / itemsPerPage);

  // Current page slice
  const currentPageItems = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return allItems.slice(start, end);
  }, [allItems, currentPage, itemsPerPage]);


  const handleAppClick = (app: AppTile) => {
    setOpenApp(app);
  };

  // Resizer handlers
  const startCornerResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = containerWidth;
    const startH = containerHeight;
    const onMove = (ev: MouseEvent) => {
      const w = Math.max(320, startW + (ev.clientX - startX));
      const h = Math.max(200, startH + (ev.clientY - startY));
      setContainerWidth(w);
      setContainerHeight(h);
      localStorage.setItem('apps.containerWidth', String(w));
      localStorage.setItem('apps.containerHeight', String(h));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startEastResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = containerWidth;
    const onMove = (ev: MouseEvent) => {
      const w = Math.max(320, startW + (ev.clientX - startX));
      setContainerWidth(w);
      localStorage.setItem('apps.containerWidth', String(w));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startSouthResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = containerHeight;
    const onMove = (ev: MouseEvent) => {
      const h = Math.max(200, startH + (ev.clientY - startY));
      setContainerHeight(h);
      localStorage.setItem('apps.containerHeight', String(h));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = containerX;
    const startPosY = containerY;
    const onMove = (ev: MouseEvent) => {
      const x = startPosX + (ev.clientX - startX);
      const y = startPosY + (ev.clientY - startY);
      setContainerX(x);
      setContainerY(y);
      localStorage.setItem('apps.containerX', String(x));
      localStorage.setItem('apps.containerY', String(y));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startNorthResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startH = containerHeight;
    const onMove = (ev: MouseEvent) => {
      const h = Math.max(200, startH - (ev.clientY - startY));
      setContainerHeight(h);
      localStorage.setItem('apps.containerHeight', String(h));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const startWestResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = containerWidth;
    const onMove = (ev: MouseEvent) => {
      const w = Math.max(320, startW - (ev.clientX - startX));
      setContainerWidth(w);
      localStorage.setItem('apps.containerWidth', String(w));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Favorites Section */}
      <section className="shrink-0 bg-gradient-to-b from-muted/40 to-muted/20 px-4 py-3 mb-4">
        <h3 className="text-base font-semibold text-foreground mb-2 text-center">Favorites</h3>
        <FavoritesBar size={72} gap={12} />
      </section>

      {/* Apps Grid - Separate Box */}
      <div className="flex-1 overflow-auto bg-background relative">
        

        <div 
          ref={boxRef}
          className="border-2 border-border rounded-lg bg-muted/20 relative resize overflow-hidden"
          style={{ 
            width: `${containerWidth}px`,
            height: `${containerHeight}px`,
            position: 'absolute',
            left: `${containerX}px`,
            top: `${containerY}px`,
          }}
        >
          <div className="w-full h-full">
            {/* App Icons Grid - Background Layer */}
            <div 
              className={cn("grid gap-1 place-content-center w-full h-full transition-opacity duration-200", openApp && "opacity-20")}
              style={{
                gridTemplateColumns: `repeat(${gridDims.cols}, ${tile}px)`,
                gridTemplateRows: `repeat(${gridDims.rows}, ${tile}px)`,
              }}
            >
              {currentPageItems.map((app) => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    className={cn(
                      "flex flex-col items-center justify-between gap-1 p-1",
                      "rounded-2xl",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    )}
                    style={{ width: tile, height: tile }}
                    aria-label={app.label}
                    title={app.label}
                  >
                    <div 
                      className={cn(
                        "flex items-center justify-center flex-1 w-full",
                        "shadow-sm",
                        `bg-gradient-to-br ${app.color || 'from-primary/20 to-primary/5'}`,
                        "border border-border/60 rounded-xl"
                      )}
                    >
                      <Icon 
                        className="text-white drop-shadow-sm w-1/2 h-1/2"
                        strokeWidth={1.5} 
                      />
                    </div>
                    <span className="text-[10px] leading-tight text-center font-medium truncate max-w-full">
                      {app.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Opened App Overlay - Foreground Layer */}
            {openApp && (
              <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col">
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <h2 className="text-lg font-semibold">{openApp.label}</h2>
                  <button 
                    onClick={() => setOpenApp(null)}
                    className="px-3 py-1 text-sm rounded-lg bg-muted hover:bg-muted/80"
                  >
                    Close
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <p className="text-muted-foreground">
                    Content for {openApp.label} would go here...
                  </p>
                </div>
              </div>
            )}
          </div>
          
          
          <div onMouseDown={startDrag} className="absolute top-0 left-0 right-0 h-8 bg-primary/30 hover:bg-primary/50 cursor-move rounded-t flex items-center justify-center">
            <div className="w-12 h-1 bg-white/50 rounded-full" />
          </div>
          <div onMouseDown={startNorthResize} className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-12 bg-primary/50 hover:bg-primary/70 cursor-ns-resize rounded-b" />
          <div onMouseDown={startWestResize} className="absolute left-0 top-1/2 -translate-y-1/2 h-12 w-2 bg-primary/50 hover:bg-primary/70 cursor-ew-resize rounded-r" />
          <div onMouseDown={startCornerResize} className="absolute bottom-0 right-0 h-4 w-4 rounded-tl bg-primary/70 hover:bg-primary cursor-nwse-resize" />
          <div onMouseDown={startEastResize} className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-2 bg-primary/50 hover:bg-primary/70 cursor-ew-resize rounded-l" />
          <div onMouseDown={startSouthResize} className="absolute bottom-0 left-1/2 -translate-x-1/2 h-2 w-12 bg-primary/50 hover:bg-primary/70 cursor-ns-resize rounded-t" />

          {/* Pagination Controls */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1 rounded-full border border-border">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <span className="text-xs text-muted-foreground">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="text-xs px-2 py-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
