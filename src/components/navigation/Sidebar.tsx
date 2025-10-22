/**
 * Desktop Sidebar Navigation
 * Opens overlays via ?app= query param for workspace items
 */

import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

type NavItem = 
  | { type: 'link'; path: string; label: string; testId?: string }
  | { type: 'overlay'; appKey: string; label: string; testId: string };

export function Sidebar() {
  const location = useLocation();
  const [, setSp] = useSearchParams();
  
  const openApp = (key: string) => {
    const next = new URLSearchParams(location.search);
    next.set('app', key);
    setSp(next);
  };
  
  const isActive = (path: string) => 
    location.pathname === path || location.pathname.startsWith(path + '/');

  const sections: Array<{ title: string; items: NavItem[] }> = [
    {
      title: 'Workspace',
      items: [
        { type: 'overlay', appKey: 'yallbrary', label: 'Yallbrary', testId: 'nav-yallbrary' },
        { type: 'overlay', appKey: 'marketplace', label: 'Marketplace', testId: 'nav-marketplace' },
        { type: 'link', path: '/messages', label: 'Messages', testId: 'nav-messages' },
        { type: 'link', path: '/entities', label: 'Entities', testId: 'nav-entities' },
        { type: 'link', path: '/events', label: 'Events', testId: 'nav-events' },
      ],
    },
    {
      title: 'AI Workspace',
      items: [
        { type: 'link', path: '/super-andy', label: 'Super Andy', testId: 'nav-andy' },
        { type: 'link', path: '/rocker', label: 'User Rocker', testId: 'nav-rocker' },
      ],
    },
  ];

  return (
    <aside
      role="complementary"
      aria-label="Sidebar"
      data-testid="nav-sidebar"
      className="hidden lg:block w-64 shrink-0 border-r h-screen sticky top-0 bg-sidebar"
    >
      <div className="p-4 font-semibold text-sidebar-foreground">Control Center</div>
      {sections.map((section) => (
        <section key={section.title} className="px-3 mb-6">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-3">
            {section.title}
          </h2>
          <ul className="flex flex-col gap-1">
            {section.items.map((item) => {
              if (item.type === 'overlay') {
                return (
                  <li key={item.appKey}>
                    <button
                      data-testid={item.testId}
                      aria-label={item.label}
                      className="w-full text-left px-3 py-2 rounded text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
                      onClick={() => openApp(item.appKey)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  </li>
                );
              }
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    data-testid={item.testId}
                    className={cn(
                      "block px-3 py-2 rounded text-sm transition-colors",
                      isActive(item.path)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </aside>
  );
}
