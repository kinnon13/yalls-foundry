/**
 * Desktop Sidebar Navigation
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const location = useLocation();
  
  const isActive = (path: string) => 
    location.pathname === path || location.pathname.startsWith(path + '/');

  const sections = [
    {
      title: 'Workspace',
      items: [
        { path: '/?app=yallbrary', label: 'Yallbrary', testId: 'nav-yallbrary' },
        { path: '/?app=marketplace', label: 'Marketplace' },
        { path: '/messages', label: 'Messages' },
        { path: '/entities', label: 'Entities' },
        { path: '/events', label: 'Events' },
      ],
    },
    {
      title: 'AI Workspace',
      items: [
        { path: '/super-andy', label: 'Super Andy' },
        { path: '/rocker', label: 'User Rocker' },
      ],
    },
  ];

  return (
    <aside
      data-testid="nav-sidebar"
      className="hidden lg:block w-64 shrink-0 border-r h-screen sticky top-0 bg-sidebar"
    >
      <div className="p-4 font-semibold text-sidebar-foreground">Control Center</div>
      {sections.map((section) => (
        <div key={section.title} className="px-3 mb-6">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2 px-3">
            {section.title}
          </h3>
          <nav className="flex flex-col gap-1">
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={item.testId}
                className={cn(
                  "px-3 py-2 rounded text-sm transition-colors",
                  isActive(item.path)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
}
