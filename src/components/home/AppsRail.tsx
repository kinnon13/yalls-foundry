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
    title: 'MANAGE',
    apps: [
      { id: 'overview', icon: Briefcase, label: 'Overview' },
      { id: 'earnings', icon: DollarSign, label: 'Earnings' },
      { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
      { id: 'crm', icon: Users, label: 'CRM' },
    ]
  },
  {
    title: 'COMMERCE',
    apps: [
      { id: 'marketplace', icon: Package, label: 'Marketplace' },
      { id: 'orders', icon: ShoppingCart, label: 'Orders' },
      { id: 'listings', icon: Receipt, label: 'Listings' },
      { id: 'cart', icon: ShoppingCart, label: 'Cart' },
    ]
  },
  {
    title: 'SOCIAL',
    apps: [
      { id: 'messages', icon: Users, label: 'Messages' },
      { id: 'events', icon: TrendingUp, label: 'Events' },
      { id: 'discover', icon: TrendingUp, label: 'Discover' },
      { id: 'activity', icon: TrendingUp, label: 'Activity' },
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
