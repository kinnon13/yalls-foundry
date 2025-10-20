import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, MessageSquare, Store, Globe2, AppWindow, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatDrawer } from '@/components/chat/ChatDrawer';
import { trackFooterClick } from '@/lib/telemetry/events';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

type DockItem = {
  key: string;
  label: string;
  to?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function BottomDock() {
  const nav = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const { session } = useSession();
  const [pinnedApps, setPinnedApps] = useState<any[]>([]);

  // Load pinned apps from DB
  useEffect(() => {
    if (!session?.userId) return;
    
    const loadPinnedApps = async () => {
      const { data, error } = await supabase
        .from('user_app_layout')
        .select('app_id, order_index')
        .eq('user_id', session.userId)
        .eq('pinned', true)
        .order('order_index', { ascending: true });
      
      if (!error && data) {
        setPinnedApps(data);
      }
    };
    
    loadPinnedApps();
  }, [session?.userId]);

  // Merge pinned apps into dock items (show last 2 pinned on right side)
  const coreItems: DockItem[] = [
    {
      key: 'home',
      label: 'Home',
      to: '/home?tab=for-you',
      icon: Globe2,
    },
    {
      key: 'search',
      label: 'Search',
      to: '/discover',
      icon: Globe2,
    },
    {
      key: 'rocker',
      label: 'Rocker',
      to: '/rocker',
      icon: Brain,
    },
  ];

  const rightItems: DockItem[] = [];
  
  // Add up to 2 pinned apps before profile
  if (pinnedApps.length > 0) {
    pinnedApps.slice(-2).forEach(app => {
      rightItems.push({
        key: app.app_id,
        label: app.app_id,
        to: `/?app=${app.app_id}`,
        icon: Store, // Could be dynamic based on app
      });
    });
  }
  
  rightItems.push({
    key: 'profile',
    label: 'Profile',
    onClick: () => nav('/profile/me'),
    icon: AppWindow,
  });

  const items = [...coreItems, ...rightItems];

  return (
    <>
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      
      <nav
        role="navigation"
        aria-label="Bottom dock"
        className={cn(
          'fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur border-t border-border/60',
          'px-2 pb-[max(0px,env(safe-area-inset-bottom))]'
        )}
      >
      <div className="mx-auto max-w-[800px] h-16 grid grid-cols-5 gap-2 items-end">
        {items.map((it) => {
          const Icon = it.icon;
          const isCreate = it.key === 'create';
          const content = (
            <div
              className={cn(
                'relative flex flex-col items-center gap-1',
                isCreate && 'translate-y-[-12px]'
              )}
            >
              <div
                className={cn(
                  'relative h-14 w-14 rounded-3xl bg-gradient-to-br from-accent/40 to-accent/20',
                  'backdrop-blur-md ring-1 ring-border/60 shadow-lg transition-transform duration-200',
                  'hover:scale-105 active:scale-95'
                )}
                aria-hidden
              >
                <div className="absolute inset-x-2 top-1 h-5 rounded-b-full bg-foreground/10 opacity-70 blur-[2px] pointer-events-none" />
                <Icon className="absolute inset-0 m-auto text-foreground w-7 h-7" />
              </div>
              <span className="text-[10px] leading-tight font-medium truncate max-w-full">
                {it.label}
              </span>
            </div>
          );

          return it.to ? (
            <Link
              key={it.key}
              to={it.to}
              onClick={() => trackFooterClick(it.key)}
              className="relative flex flex-col items-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all"
              aria-label={it.label}
              title={it.label}
              data-testid={`dock-${it.key}`}
            >
              {content}
            </Link>
          ) : (
            <button
              key={it.key}
              onClick={() => {
                trackFooterClick(it.key);
                it.onClick?.();
              }}
              className="relative flex flex-col items-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all"
              aria-label={it.label}
              title={it.label}
              data-testid={`dock-${it.key}`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}
