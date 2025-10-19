/**
 * Apps Rail - iPhone-style grid
 */

import { useOpenApp } from '@/lib/nav/useOpenApp';
import type { OverlayKey } from '@/lib/overlay/types';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Users,
  TrendingUp,
  Briefcase,
  Receipt,
  Calendar,
  MessageCircle,
  BarChart3,
  Heart
} from 'lucide-react';

const ALL_APPS: Array<{ id: OverlayKey; icon: any; label: string; gradient: string }> = [
  { id: 'overview', icon: Briefcase, label: 'Overview', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'mlm', icon: Users, label: 'Affiliate', gradient: 'from-purple-600 to-pink-600' },
  { id: 'earnings', icon: DollarSign, label: 'Earnings', gradient: 'from-green-500 to-emerald-500' },
  { id: 'marketplace', icon: Package, label: 'Shop', gradient: 'from-purple-500 to-pink-500' },
  { id: 'orders', icon: ShoppingCart, label: 'Orders', gradient: 'from-orange-500 to-red-500' },
  { id: 'events', icon: Calendar, label: 'Events', gradient: 'from-red-500 to-rose-500' },
  { id: 'listings', icon: Receipt, label: 'Listings', gradient: 'from-yellow-500 to-amber-500' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics', gradient: 'from-teal-500 to-cyan-500' },
  { id: 'crm', icon: Users, label: 'CRM', gradient: 'from-violet-500 to-purple-500' },
  { id: 'discover', icon: TrendingUp, label: 'Discover', gradient: 'from-pink-500 to-rose-500' },
  { id: 'activity', icon: Heart, label: 'Activity', gradient: 'from-red-400 to-pink-400' },
  { id: 'farm-ops', icon: Calendar, label: 'Farm Ops', gradient: 'from-green-600 to-lime-500' },
];

export default function AppsRail({ manage = false }: { manage?: boolean }) {
  const openApp = useOpenApp();

  return (
    <aside className="apps-rail card" style={{ padding: '20px' }}>
      <div style={{ 
        fontSize: '11px', 
        fontWeight: 700, 
        textTransform: 'uppercase',
        letterSpacing: '1px',
        opacity: 0.5,
        marginBottom: '16px'
      }}>
        Y'all Library
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px',
      }}>
        {ALL_APPS.map(app => {
          const Icon = app.icon;
          return (
            <button
              key={app.id}
              onClick={() => openApp(app.id)}
              style={{
                aspectRatio: '1',
                borderRadius: '22px',
                border: 'none',
                background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '12px',
              }}
              className={`bg-gradient-to-br ${app.gradient}`}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
            >
              <Icon 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  color: '#fff',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }} 
                strokeWidth={2}
              />
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#fff',
                textAlign: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                lineHeight: 1.2,
              }}>
                {app.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
