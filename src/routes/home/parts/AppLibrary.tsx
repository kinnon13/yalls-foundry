import { useState } from 'react';
import { 
  Store, Search, Sparkles, Download, Clock,
  Building, Users, TrendingUp, Zap, 
  Package, ShoppingCart, DollarSign, MessageSquare,
  Calendar, BarChart3, Video, Settings, LucideIcon,
  Bell, Heart, Mail
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
  
  // Growth
  { key: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Insights & metrics', category: 'Growth', color: 'text-slate-500', installed: true },
  
  // Creator
  { key: 'studio', label: 'Creator Studio', icon: Video, description: 'Video editing & publishing', category: 'Creator', color: 'text-rose-500' },
  
  // System
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
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-xl font-semibold tracking-tight mb-0.5">Y'all Library</h2>
        <p className="text-sm text-muted-foreground">Your apps & tools</p>
      </div>

      {/* Ask Rocker */}
      <div className="px-6 mb-3">
        <div className="relative">
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
          <Input
            placeholder="Ask Rocker anything..."
            className="pl-10 h-10 bg-primary/5 border-primary/20 hover:border-primary/30 focus:border-primary/40 text-sm rounded-xl transition-colors"
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-sm rounded-xl hover:border-primary/20 transition-colors"
          />
        </div>
      </div>

      {/* Scope tabs */}
      <div className="px-6 mb-4">
        <div className="flex gap-1.5 p-1 bg-muted/50 rounded-xl">
          <button
            onClick={() => setScope('installed')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              scope === 'installed' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            My Apps
          </button>
          <button
            onClick={() => setScope('all')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              scope === 'all' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            All Apps
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 mb-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* App Grid - Premium Mac style */}
      <div className="flex-1 overflow-y-auto px-6">
        <div className="grid grid-cols-3 gap-4 pb-6">
          {filteredApps.map((app) => (
            <button
              key={app.key}
              onClick={() => onAppClick({ 
                key: app.key, 
                label: app.label, 
                icon: app.icon,
                color: app.color 
              })}
              className="group relative flex flex-col items-center p-3 rounded-2xl hover:bg-accent/50 active:scale-95 transition-all duration-200"
            >
              {/* Icon - Mac style with elevation */}
              <div className={`w-16 h-16 rounded-[22px] bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-border/40 flex items-center justify-center mb-2.5 group-hover:scale-105 group-hover:shadow-lg transition-all duration-200 ${app.color}`}>
                <app.icon className="w-8 h-8" strokeWidth={1.5} />
              </div>

              {/* Label */}
              <span className="text-[11px] font-medium text-center leading-tight line-clamp-2 w-full">
                {app.label}
              </span>

              {/* Update indicator */}
              {app.updateAvailable && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full shadow-sm" />
              )}
            </button>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">No apps found</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="border-t px-6 py-4 bg-muted/30">
        <p className="text-xs text-muted-foreground text-center font-medium">
          {installedCount} app{installedCount !== 1 ? 's' : ''} installed
        </p>
      </div>
    </div>
  );
}
