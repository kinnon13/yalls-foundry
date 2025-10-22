/**
 * Bottom Navigation for Mobile
 * Opens overlays via ?app= query param
 */

import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Home, Search, MessageCircle, User, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = 
  | { type: 'link'; path: string; label: string; icon: any; testId?: string }
  | { type: 'overlay'; appKey: string; label: string; icon: any; testId: string };

export function BottomNav() {
  const location = useLocation();
  const [, setSp] = useSearchParams();
  
  const openApp = (key: string) => {
    const next = new URLSearchParams(location.search);
    next.set('app', key);
    setSp(next);
  };
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems: NavItem[] = [
    { type: 'link', path: '/', label: 'Home', icon: Home, testId: 'nav-home' },
    { type: 'overlay', appKey: 'yallbrary', label: 'Yallbrary', icon: Search, testId: 'nav-yallbrary' },
    { type: 'link', path: '/super-andy', label: 'Andy', icon: Brain, testId: 'nav-andy' },
    { type: 'link', path: '/rocker', label: 'Rocker', icon: User, testId: 'nav-rocker' },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Bottom"
      data-testid="nav-bottom"
      className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t flex justify-around py-2 sm:hidden"
    >
      {navItems.map((item) => {
        if (item.type === 'overlay') {
          return (
            <button
              key={item.appKey}
              data-testid={item.testId}
              aria-label={item.label}
              className="flex flex-col items-center px-3 py-1 text-xs transition-colors text-muted-foreground hover:text-primary"
              onClick={() => openApp(item.appKey)}
              type="button"
            >
              <item.icon size={20} />
              <span className="mt-1">{item.label}</span>
            </button>
          );
        }
        
        return (
          <Link
            key={item.path}
            to={item.path}
            data-testid={item.testId}
            className={cn(
              "flex flex-col items-center px-3 py-1 text-xs transition-colors",
              isActive(item.path) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon size={20} />
            <span className="mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
