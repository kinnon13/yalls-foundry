/**
 * Mobile Tab Bar - Fixed 5 Tabs
 * TikTok-style bottom navigation
 */

import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function MobileTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine active tab based on route and feed param
  const getActiveTab = () => {
    if (location.pathname.startsWith('/discover')) return 'search';
    if (location.pathname.startsWith('/messages')) return 'inbox';
    if (location.pathname === '/') {
      const feed = searchParams.get('feed');
      if (feed === 'profile') return 'profile';
      return 'home';
    }
    if (location.pathname.startsWith('/profile')) return 'profile';
    return '';
  };

  const activeTab = getActiveTab();

  const tabs = [
    {
      id: 'home',
      icon: Home,
      label: 'Home',
      onClick: () => navigate('/?feed=for-you'),
    },
    {
      id: 'search',
      icon: Search,
      label: 'Search',
      onClick: () => navigate('/discover?q='),
    },
    {
      id: 'create',
      icon: PlusCircle,
      label: 'Create',
      onClick: () => {
        const next = new URLSearchParams(searchParams);
        next.set('modal', 'create_post');
        const feed = searchParams.get('feed');
        const userId = searchParams.get('user') || '';
        const context = feed === 'profile' && userId ? `source:profile:${userId}` : 'source:feed';
        next.set('context', context);
        setSearchParams(next);
      },
    },
    {
      id: 'inbox',
      icon: MessageCircle,
      label: 'Inbox',
      onClick: () => navigate('/messages'),
    },
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      onClick: () => navigate('/?feed=profile'),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-lg border-t border-border/50 lg:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isCreate = tab.id === 'create';

          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-all',
                isCreate && 'relative',
                isActive && !isCreate ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isCreate ? (
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
                </div>
              ) : (
                <>
                  <Icon 
                    className={cn('h-6 w-6', isActive && 'fill-current')} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                    {tab.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
