/**
 * Apps Rail - Left sidebar with organized apps
 */

import { useOpenApp } from '@/lib/nav/useOpenApp';
import type { OverlayKey } from '@/lib/overlay/types';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  CreditCard, 
  Receipt,
  Briefcase,
  Users,
  TrendingUp
} from 'lucide-react';

const APP_SECTIONS: Array<{
  title: string;
  apps: Array<{ id: OverlayKey; icon: any; label: string }>;
}> = [
  {
    title: 'COMMERCE',
    apps: [
      { id: 'orders', icon: ShoppingCart, label: 'Orders' },
      { id: 'marketplace', icon: Receipt, label: 'Listings' },
    ]
  },
  {
    title: 'NETWORK',
    apps: [
      { id: 'events', icon: TrendingUp, label: 'Events' },
      { id: 'messages', icon: Users, label: 'Messages' },
    ]
  }
];

export default function AppsRail({ manage = false }: { manage?: boolean }) {
  const openApp = useOpenApp();

  return (
    <aside className="apps-rail card">
      <div className="rail-head">{manage ? 'Management Tools' : 'Y\'all App Library'}</div>
      
      {APP_SECTIONS.map(section => (
        <div key={section.title} className="rail-section">
          <div className="rail-section-title">{section.title}</div>
          <div className="rail-grid">
            {section.apps.map(app => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  className="tile"
                  onClick={() => openApp(app.id)}
                >
                  <Icon className="tile-icn" />
                  <span className="tile-label">{app.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}
