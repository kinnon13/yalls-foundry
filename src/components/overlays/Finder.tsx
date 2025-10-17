/**
 * Finder - Quick Actions Modal (⌘K)
 * Deep links into Dashboard tasks and Rocker suggestions
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Users, Calendar, ShoppingBag, Settings, Search } from 'lucide-react';

interface QuickAction {
  action: string;
  why: string;
  cta: string;
  href: string;
  icon?: React.ReactNode;
}

const STATIC_ACTIONS: QuickAction[] = [
  {
    action: 'create_listing',
    why: 'Listings boost discovery and earnings',
    cta: 'Create Listing',
    href: '/listings/new',
    icon: <ShoppingBag className="h-4 w-4" />
  },
  {
    action: 'create_post',
    why: 'Share updates with your audience',
    cta: 'Create Post',
    href: '/',
    icon: <Plus className="h-4 w-4" />
  },
  {
    action: 'create_event',
    why: 'Host and promote events',
    cta: 'Create Event',
    href: '/events/new',
    icon: <Calendar className="h-4 w-4" />
  },
  {
    action: 'claim_entity',
    why: 'Claim your business or horse page',
    cta: 'Claim Entity',
    href: '/entities',
    icon: <Users className="h-4 w-4" />
  },
  {
    action: 'browse_discover',
    why: 'Explore trending content',
    cta: 'Discover',
    href: '/discover',
    icon: <Search className="h-4 w-4" />
  },
  {
    action: 'dashboard',
    why: 'Manage your content and settings',
    cta: 'Dashboard',
    href: '/dashboard',
    icon: <FileText className="h-4 w-4" />
  },
  {
    action: 'settings',
    why: 'Update your profile and preferences',
    cta: 'Settings',
    href: '/dashboard?m=settings',
    icon: <Settings className="h-4 w-4" />
  }
];

export function Finder() {
  const [open, setOpen] = useState(false);
  const [actions] = useState<QuickAction[]>(STATIC_ACTIONS);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Quick Actions</DialogTitle>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Search actions..." />
          <CommandList>
            <CommandEmpty>No actions found.</CommandEmpty>
            <CommandGroup heading="Actions">
              {actions.map((action) => (
                <CommandItem
                  key={action.action}
                  value={action.cta}
                  onSelect={() => handleSelect(action.href)}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  {action.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{action.cta}</p>
                    <p className="text-xs text-muted-foreground">{action.why}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
