/**
 * Role: Unified navigation for Yalls sections
 * Path: src/lib/shared/ui/NavBar.tsx
 * Responsive: Sidebar for web (lg), hamburger for tablet (md), bottom nav for mobile (sm)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppId } from '@/apps/types';

interface NavSection {
  id: AppId;
  label: string;
}

const sections: NavSection[] = [
  { id: 'yallbrary', label: 'Library' },
  { id: 'business', label: 'Business' },
  { id: 'crm', label: 'CRM' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'messages', label: 'Messages' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'earnings', label: 'Earnings' },
  { id: 'settings', label: 'Settings' },
];

export function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentApp = new URLSearchParams(window.location.search).get('app') as AppId | null;

  const handleNavigate = (appId: AppId) => {
    const url = new URL(window.location.href);
    url.searchParams.set('app', appId);
    window.location.href = url.toString();
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger (visible on md and below) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="min-w-11 h-11"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Dropdown Menu (visible when hamburger is clicked) */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
          <div className="p-20 space-y-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={currentApp === section.id ? 'default' : 'ghost'}
                className="w-full justify-start text-lg"
                onClick={() => handleNavigate(section.id)}
              >
                {section.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Sidebar (hidden on md and below, visible on lg) */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-r lg:bg-muted/30 lg:p-4 lg:space-y-2 lg:z-30">
        <h3 className="text-lg font-semibold mb-4 px-2">Yalls Apps</h3>
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={currentApp === section.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleNavigate(section.id)}
          >
            {section.label}
          </Button>
        ))}
      </nav>

      {/* Tablet/Desktop Dropdown (visible on md, hidden on lg and sm) */}
      <div className="hidden md:flex lg:hidden fixed top-4 left-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-11">
              {currentApp ? sections.find(s => s.id === currentApp)?.label || 'Apps' : 'Apps'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover">
            {sections.map((section) => (
              <DropdownMenuItem
                key={section.id}
                onClick={() => handleNavigate(section.id)}
                className={cn(currentApp === section.id && 'bg-accent')}
              >
                {section.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
