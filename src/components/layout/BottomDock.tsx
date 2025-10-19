import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PlusCircle, MessageCircle, Store, Globe2, AppWindow } from 'lucide-react';
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
      key: 'create',
      label: 'Create',
      onClick: () => nav('/create'),
      icon: PlusCircle,
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
        className="bg-background/90 backdrop-blur border-t border-border/60 px-2"
        style={{ 
          paddingBottom: 'calc(max(0px, env(safe-area-inset-bottom)) + 0px)',
          height: 'var(--dock-h)'
        }}
      >
      <div className="mx-auto max-w-[800px] h-16 grid grid-cols-5 gap-2 items-end">
        {items.map((it) => {
          const Icon = it.icon;
          const isCreate = it.key === 'create';
          const content = (
            <div
              className={cn(
                'flex flex-col items-center gap-1',
                isCreate && 'translate-y-[-12px]'
              )}
            >
              <div
                className={cn(
                  'grid place-items-center rounded-2xl shadow-lg transition-all duration-200',
                  'border border-white/10',
                  isCreate 
                    ? 'h-14 w-14 bg-gradient-to-br from-primary/30 to-primary/10'
                    : 'h-12 w-12 bg-gradient-to-br from-primary/20 to-primary/5'
                )}
                aria-hidden
              >
                <Icon 
                  className={cn(
                    'text-white drop-shadow-sm',
                    isCreate ? 'w-7 h-7' : 'w-6 h-6'
                  )} 
                />
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
              className="relative flex flex-col items-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all"
              aria-label={it.label}
              title={it.label}
            >
              {content}
            </Link>
          ) : (
            <button
              key={it.key}
              onClick={it.onClick}
              className="relative flex flex-col items-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary transition-all"
              aria-label={it.label}
              title={it.label}
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
