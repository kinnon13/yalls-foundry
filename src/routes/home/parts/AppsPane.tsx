import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoritesBar } from '@/components/social/FavoritesBar';
import { supabase } from '@/integrations/supabase/client';

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
  const [currentPage, setCurrentPage] = useState(0);

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

  // Combine all visible apps
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

  // Calculate items per page
  const itemsPerPage = useMemo(() => {
    const cols = Math.floor(containerWidth / (tile + 12)); // 12px gap
    const rows = Math.floor(containerHeight / (tile + 12));
    return Math.max(1, cols * rows);
  }, [containerWidth, containerHeight, tile]);

  // All items (apps + pinned entities)
  const allItems = useMemo(() => [...visibleApps], [visibleApps]);

  // Calculate total pages
  const totalPages = Math.ceil(allItems.length / itemsPerPage);

  // Get current page items
  const currentPageItems = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return allItems.slice(start, end);
  }, [allItems, currentPage, itemsPerPage]);


  const handleAppClick = (app: AppTile) => {
    if (app.route) {
      navigate(app.route);
    } else if (app.module) {
      navigate(`/dashboard?m=${app.module}`);
    }
  };


  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Favorites Section */}
      <section className="shrink-0 bg-gradient-to-b from-muted/40 to-muted/20 px-4 py-3 border-b border-border/50">
        <h3 className="text-base font-semibold text-foreground mb-2 text-center">Favorites</h3>
        <FavoritesBar size={72} gap={12} />
      </section>

      {/* Apps Grid - Separate Box */}
      <div className="flex-1 overflow-auto bg-background p-4">
        

        <div 
          ref={boxRef}
          className="border-2 border-border rounded-lg bg-muted/20 p-3 relative resize overflow-auto"
          style={{ 
            width: `${containerWidth}px`,
            height: `${containerHeight}px`,
          }}
        >
          <div 
            className="grid gap-3 w-fit h-fit"
            style={{
              gridTemplateColumns: `repeat(${Math.floor(containerWidth / (tile + 12))}, ${tile}px)`,
              gridTemplateRows: `repeat(${Math.floor(containerHeight / (tile + 12))}, ${tile}px)`,
            }}
          >

        {/* Installed apps - now filtered by capabilities */}
        {currentPageItems.map((app) => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className={cn(
                "flex flex-col items-center justify-between gap-2 p-3",
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
