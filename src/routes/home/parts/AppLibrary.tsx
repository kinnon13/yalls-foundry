import { useState } from 'react';
import { 
  Store, Search, Sparkles, Download, Clock,
  Building, Users, TrendingUp, Zap, 
  Package, ShoppingCart, DollarSign, MessageSquare,
  Calendar, BarChart3, Video, Settings, LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  { key: 'inventory', label: 'Inventory', icon: Package, description: 'Track stock & SKUs', category: 'Commerce', color: 'text-purple-500', installed: true },
  { key: 'listings', label: 'Listings', icon: Store, description: 'Create marketplace listings', category: 'Commerce', color: 'text-orange-500' },
  
  // Money
  { key: 'earnings', label: 'Earnings', icon: DollarSign, description: 'View sales & revenue', category: 'Money', color: 'text-emerald-500', installed: true },
  
  // Ops
  { key: 'messages', label: 'Messages', icon: MessageSquare, description: 'Unified inbox & CRM', category: 'Ops', color: 'text-blue-400', installed: true },
  { key: 'calendar', label: 'Calendar', icon: Calendar, description: 'Events & bookings', category: 'Ops', color: 'text-red-400' },
  
  // Growth
  { key: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Insights & metrics', category: 'Growth', color: 'text-slate-500' },
  
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
    <div className="h-full flex flex-col">
      {/* Scope chips */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setScope('installed')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            scope === 'installed' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Installed
        </button>
        <button
          onClick={() => setScope('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            scope === 'all' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          All Apps
        </button>
        <button
          onClick={() => setScope('updates')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            scope === 'updates' 
              ? 'bg-primary text-primary-foreground shadow-md' 
              : 'bg-muted hover:bg-muted/80'
          }`}
        >
          Updates
        </button>
      </div>

      {/* Ask Rocker */}
      <div className="relative mb-6">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <Input
          placeholder="Ask Rocker: 'Find a returns app for my Tack Shop'"
          className="pl-10 bg-primary/5 border-primary/20 focus:border-primary/40"
        />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-muted hover:bg-muted/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* App Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
          {filteredApps.map((app) => (
            <button
              key={app.key}
              onClick={() => onAppClick({ 
                key: app.key, 
                label: app.label, 
                icon: app.icon,
                color: app.color 
              })}
              className="group relative p-4 rounded-2xl bg-background border hover:border-primary/40 hover:shadow-xl transition-all duration-200 text-left"
            >
              {/* Badges */}
              <div className="absolute top-2 right-2 flex gap-1">
                {app.installed && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    <Download className="w-3 h-3" />
                  </Badge>
                )}
                {app.updateAvailable && (
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    Update
                  </Badge>
                )}
              </div>

              {/* Icon */}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-background to-muted border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${app.color}`}>
                <app.icon className="w-8 h-8" />
              </div>

              {/* Info */}
              <h3 className="font-semibold text-sm mb-1">{app.label}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{app.description}</p>

              {/* Last opened */}
              {app.lastOpened && (
                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Recently used</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No apps found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-4 mt-4 text-xs text-muted-foreground">
        {installedCount} app{installedCount !== 1 ? 's' : ''} installed
      </div>
    </div>
  );
}
