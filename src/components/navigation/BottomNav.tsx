/**
 * Bottom Navigation for Mobile
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/?app=yallbrary', label: 'Yallbrary', icon: Search, testId: 'nav-yallbrary' },
    { path: '/messages', label: 'Messages', icon: MessageCircle },
    { path: '/super-andy', label: 'Andy', icon: User },
  ];

  return (
    <nav
      data-testid="nav-bottom"
      className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t flex justify-around py-2 sm:hidden"
    >
      {navItems.map((item) => (
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
      ))}
    </nav>
  );
}
