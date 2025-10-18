/**
 * DashFooter - Sticky footer with quick actions
 */

import { Home, Compass, PlusCircle, Activity, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: PlusCircle, label: 'Create', path: '/create' },
  { icon: Activity, label: 'Activity', path: '/activity' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function DashFooter() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <footer className="sticky bottom-0 z-40 w-full border-t border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Quick nav */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                           (item.path === '/dashboard' && location.pathname.startsWith('/dashboard'));
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={2} />
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="hidden sm:inline">Online</span>
        </div>
      </div>
    </footer>
  );
}
