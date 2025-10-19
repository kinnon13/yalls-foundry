/**
 * Dock - Mac-style bottom bar with pinned apps
 */

import { useOpenApp } from '@/lib/nav/useOpenApp';
import type { OverlayKey } from '@/lib/overlay/types';
import { MessageSquare, ShoppingBag, Calendar, Users } from 'lucide-react';

const DOCK_APPS: Array<{ id: OverlayKey; icon: any; label: string }> = [
  { id: 'messages', icon: MessageSquare, label: 'Messages' },
  { id: 'marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { id: 'events', icon: Calendar, label: 'Events' },
  { id: 'orders', icon: Users, label: 'Orders' },
];

export default function Dock({ onAppClick }: { onAppClick: (id: OverlayKey) => void }) {
  return (
    <footer className="dock">
      {DOCK_APPS.map(app => {
        const Icon = app.icon;
        return (
          <button
            key={app.id}
            className="dock-icon"
            onClick={() => onAppClick(app.id)}
            title={app.label}
          >
            <Icon />
          </button>
        );
      })}
    </footer>
  );
}
