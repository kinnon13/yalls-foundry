import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, MessageCircle, Store, UserCircle2, Globe2, AppWindow } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatDrawer } from '@/components/chat/ChatDrawer';

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

  const items: DockItem[] = [
    {
      key: 'messages',
      label: 'Messages',
      onClick: () => setChatOpen(true),
      icon: MessageCircle,
    },
    {
      key: 'profile',
      label: 'Profile',
      onClick: () => nav('/home?feed=profile&entity=me'),
      icon: UserCircle2,
    },
    {
      key: 'create',
      label: 'Create',
      onClick: () => nav('/create'),
      icon: Plus,
    },
    {
      key: 'market',
      label: 'Marketplace',
      to: '/marketplace',
      icon: Store,
    },
    {
      key: 'unclaimed',
      label: 'Unclaimed',
      to: '/unclaimed',
      icon: Globe2,
    },
    {
      key: 'appstore',
      label: 'App Store',
      to: '/app-store',
      icon: AppWindow,
    },
  ];

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
      <div className="mx-auto max-w-[800px] h-16 grid grid-cols-6 gap-2">
        {items.map((it) => {
          const Icon = it.icon;
          const isCreate = it.key === 'create';
          const content = (
            <div
              className={cn(
                'flex flex-col items-center justify-center h-full',
                isCreate ? '' : 'pt-1'
              )}
            >
              <div
                className={cn(
                  'grid place-items-center rounded-xl border border-border/60 bg-gradient-to-br from-primary/10 to-primary/5',
                  isCreate ? 'h-12 w-12 shadow-lg' : 'h-10 w-10'
                )}
                aria-hidden
              >
                <Icon className={cn(isCreate ? 'h-6 w-6' : 'h-5 w-5')} />
              </div>
              <span className="text-[11px] leading-none mt-1 font-medium">{it.label}</span>
            </div>
          );

          return it.to ? (
            <Link
              key={it.key}
              to={it.to}
              className={cn(
                'relative rounded-lg hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all',
                isCreate && 'translate-y-[-6px]'
              )}
            >
              {content}
            </Link>
          ) : (
            <button
              key={it.key}
              onClick={it.onClick}
              className={cn(
                'relative rounded-lg hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all',
                isCreate && 'translate-y-[-6px]'
              )}
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
