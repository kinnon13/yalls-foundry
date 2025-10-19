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
    <div className="h-full flex flex-col p-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-1">Y'all Library</h2>
        <p className="text-xs text-muted-foreground">Your apps & tools</p>
      </div>

      {/* Ask Rocker */}
      <div className="relative mb-3">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <Input
          placeholder="Ask Rocker anything..."
          className="pl-10 h-9 bg-primary/5 border-primary/20 focus:border-primary/40 text-sm"
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-9 text-sm"
        />
      </div>

      {/* Scope tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setScope('installed')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            scope === 'installed' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Apps
        </button>
        <button
          onClick={() => setScope('all')}
          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            scope === 'all' 
              ? 'bg-background text-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* App Grid - Apple style */}
      <div className="flex-1 overflow-y-auto -mx-2">
        <div className="grid grid-cols-3 gap-3 px-2 pb-4">
          {filteredApps.map((app) => (
            <button
              key={app.key}
              onClick={() => onAppClick({ 
                key: app.key, 
                label: app.label, 
                icon: app.icon,
                color: app.color 
              })}
              className="group relative flex flex-col items-center p-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
            >
              {/* Icon - Apple style rounded square */}
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-sm ${app.color}`}>
                <app.icon className="w-7 h-7" />
              </div>

              {/* Label */}
              <span className="text-[10px] font-medium text-center leading-tight line-clamp-2 w-full">
                {app.label}
              </span>

              {/* Badge indicator */}
              {app.updateAvailable && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-muted-foreground">No apps found</p>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="border-t pt-3 mt-2">
        <p className="text-[10px] text-muted-foreground text-center">
          {installedCount} app{installedCount !== 1 ? 's' : ''} installed
        </p>
      </div>
    </div>
  );
}
