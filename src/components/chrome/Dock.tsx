/**
 * Dock - Mac-style bottom bar with pinned apps
 */

import { useOpenApp } from '@/lib/nav/useOpenApp';
import type { OverlayKey } from '@/lib/overlay/types';
import { MessageCircle, ShoppingBag, Calendar, Users, Home, LayoutDashboard } from 'lucide-react';

const DOCK_APPS: Array<{ id: OverlayKey; icon: any; label: string }> = [
  { id: 'messages', icon: MessageCircle, label: 'Messages' },
  { id: 'marketplace', icon: ShoppingBag, label: 'Shop' },
  { id: 'events', icon: Calendar, label: 'Events' },
  { id: 'orders', icon: Users, label: 'Orders' },
];

export default function Dock() {
  const openApp = useOpenApp();

  return (
    <footer className="dock">
      {DOCK_APPS.map(app => {
        const Icon = app.icon;
        return (
          <button
            key={app.id}
            className="dock-icon"
            onClick={() => openApp(app.id)}
            title={app.label}
          >
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </footer>
  );
}
