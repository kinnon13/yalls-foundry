import { useState } from 'react';
import { 
  Store, Search, Sparkles, Download, Clock,
  Building, Users, TrendingUp, Zap, 
  Package, ShoppingCart, DollarSign, MessageSquare,
  Calendar, BarChart3, Video, Settings, LucideIcon,
  Bell, Heart, Mail, User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRockerGlobal } from '@/lib/ai/rocker';

interface AppTile {
  key: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: string;
  color: string;
  installed?: boolean;
  lastOpened?: Date;
  updateAvailable?: boolean;
}

const allApps: AppTile[] = [
  // Commerce
  { key: 'orders', label: 'Orders', icon: ShoppingCart, description: 'Manage order lifecycle', category: 'Commerce', color: 'text-blue-500', installed: true },
  { key: 'cart', label: 'Cart', icon: ShoppingCart, description: 'Shopping cart & checkout', category: 'Commerce', color: 'text-blue-600', installed: true },
  { key: 'inventory', label: 'Inventory', icon: Package, description: 'Track stock & SKUs', category: 'Commerce', color: 'text-purple-500', installed: true },
  { key: 'listings', label: 'Listings', icon: Store, description: 'Create marketplace listings', category: 'Commerce', color: 'text-orange-500', installed: true },
  
  // Money
  { key: 'earnings', label: 'Earnings', icon: DollarSign, description: 'View sales & revenue', category: 'Money', color: 'text-emerald-500', installed: true },
  
  // Ops
  { key: 'messages', label: 'Messages', icon: MessageSquare, description: 'Unified inbox & CRM', category: 'Ops', color: 'text-blue-400', installed: true },
  { key: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts & updates', category: 'Ops', color: 'text-amber-500', installed: true },
  { key: 'calendar', label: 'Calendar', icon: Calendar, description: 'Events & bookings', category: 'Ops', color: 'text-red-400', installed: true },
  { key: 'favorites', label: 'Favorites', icon: Heart, description: 'Saved items & likes', category: 'Ops', color: 'text-pink-500', installed: true },
  { key: 'rocker', label: 'Rocker AI', icon: Sparkles, description: 'Your AI copilot', category: 'Ops', color: 'text-primary', installed: true },
  
  // Growth
  { key: 'mlm', label: 'Affiliate', icon: Users, description: 'Grow your network', category: 'Growth', color: 'text-violet-600', installed: true },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Insights & metrics', category: 'Growth', color: 'text-slate-500', installed: true },
  
  // Creator
  { key: 'studio', label: 'Creator Studio', icon: Video, description: 'Video editing & publishing', category: 'Creator', color: 'text-rose-500' },
  
  // System
  { key: 'profile', label: 'My Profile', icon: User, description: 'View and edit your profile', category: 'System', color: 'text-blue-600', installed: true },
  { key: 'settings', label: 'Settings', icon: Settings, description: 'App preferences', category: 'System', color: 'text-gray-500', installed: true },
];

const categories = ['All', 'Commerce', 'Money', 'Ops', 'Growth', 'Creator', 'System'];

interface AppLibraryProps {
  onAppClick: (app: { key: string; label: string; icon: LucideIcon; color: string }) => void;
}

export default function AppLibrary({ onAppClick }: AppLibraryProps) {
  const [scope, setScope] = useState<'installed' | 'all' | 'updates'>('installed');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { setIsOpen } = useRockerGlobal();
  const filteredApps = allApps.filter(app => {
    // Filter by scope
    if (scope === 'installed' && !app.installed) return false;
    if (scope === 'updates' && !app.updateAvailable) return false;
    
    // Filter by category
    if (selectedCategory !== 'All' && app.category !== selectedCategory) return false;
    
    // Filter by search
    if (searchQuery && !app.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const installedCount = allApps.filter(a => a.installed).length;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Mathematical Precision */}
      <div className="px-7 pt-8 pb-6 border-b border-border/40">
        <h2 className="text-2xl font-semibold tracking-tight mb-1.5 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">Y'all Library</h2>
        <p className="text-sm text-muted-foreground font-medium">Your apps & tools</p>
      </div>

      {/* Ask Rocker - Premium Input */}
      <div className="px-7 pt-6 pb-5">
        <div className="relative group">
          <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          <Input
            placeholder="Ask Rocker anything..."
            className="pl-11 h-12 bg-primary/5 border-primary/20 hover:border-primary/30 focus:border-primary/50 focus:bg-primary/10 text-sm rounded-2xl transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Search - Refined Interaction */}
      <div className="px-7 pb-5">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 text-sm rounded-2xl hover:border-primary/20 focus:border-primary/40 transition-all shadow-sm bg-muted/30"
          />
        </div>
      </div>

      {/* Scope Tabs - Mac Segmented Control */}
      <div className="px-7 pb-5">
        <div className="flex gap-0.5 p-1 bg-muted/60 rounded-2xl shadow-inner">
          <button
            onClick={() => setScope('installed')}
            className={`flex-1 px-5 py-3 rounded-[14px] text-sm font-semibold transition-all duration-200 ${
              scope === 'installed' 
                ? 'bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12)] scale-[1.02]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            My Apps
          </button>
          <button
            onClick={() => setScope('all')}
            className={`flex-1 px-5 py-3 rounded-[14px] text-sm font-semibold transition-all duration-200 ${
              scope === 'all' 
                ? 'bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.12)] scale-[1.02]' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            All Apps
          </button>
        </div>
      </div>

      {/* Categories - Enhanced Pills with Proper Gaps */}
      <div className="px-7 pb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.12)] scale-105'
                  : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* App Grid - Perfect Mac Spacing */}
      <div className="flex-1 overflow-y-auto px-7 pb-6">
        <div className="grid grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <button
              key={app.key}
              onClick={() => {
                if (app.key === 'rocker') { setIsOpen(true); return; }
                onAppClick({ 
                  key: app.key, 
                  label: app.label, 
                  icon: app.icon,
                  color: app.color 
                });
              }}
              className="group relative flex flex-col items-center p-4 rounded-3xl hover:bg-accent/50 active:scale-95 transition-all duration-200"
            >
              {/* Icon - True Mac Depth */}
              <div className={`w-20 h-20 rounded-[26px] bg-gradient-to-br from-primary/12 via-primary/8 to-primary/4 border border-border/40 flex items-center justify-center mb-3.5 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] group-active:scale-105 transition-all duration-300 ${app.color}`}>
                <app.icon className="w-10 h-10" strokeWidth={1.75} />
              </div>

              {/* Label - Perfect Typography */}
              <span className="text-[11px] font-semibold text-center leading-tight line-clamp-2 w-full tracking-tight">
                {app.label}
              </span>

              {/* Update Indicator */}
              {app.updateAvailable && (
                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full shadow-sm animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm text-muted-foreground font-medium">No apps found</p>
          </div>
        )}
      </div>

      {/* Footer - Premium Finish */}
      <div className="border-t border-border/40 px-7 py-5 bg-gradient-to-t from-muted/30 to-transparent">
        <p className="text-xs text-muted-foreground text-center font-semibold tracking-wide">
          {installedCount} app{installedCount !== 1 ? 's' : ''} installed
        </p>
      </div>
    </div>
  );
}
