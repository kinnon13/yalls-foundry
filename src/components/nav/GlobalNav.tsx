/**
 * Global Nav - Fixed tabs per spec
 * Home | Discover | Dashboard | Messages
 */

import { Link, useLocation } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { Home, Compass, LayoutDashboard, MessageSquare } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const iconMap = {
  Home,
  Compass,
  LayoutDashboard,
  MessageSquare,
};

const NAV_ITEMS = [
  { key: 'home', label: 'Home', path: '/feed', icon: 'Home' },
  { key: 'discover', label: 'Discover', path: '/discover', icon: 'Compass' },
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard-v2', icon: 'LayoutDashboard', requireAuth: true },
  { key: 'messages', label: 'Messages', path: '/messages', icon: 'MessageSquare', requireAuth: true },
];

export default function GlobalNav() {
  const { session } = useSession();
  const loc = useLocation();

  // Get unread message count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-messages', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return 0;
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_user_id', session.userId)
        .is('read_at', null);
      return count ?? 0;
    },
    enabled: !!session?.userId,
  });

  const visibleItems = NAV_ITEMS.filter(item => !item.requireAuth || session);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.xs }}>
      {visibleItems.map(item => {
        const active = loc.pathname.startsWith(item.path);
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const badgeCount = item.key === 'messages' ? unreadCount : 0;
        
        return (
          <Link key={item.key} to={item.path}>
            <Button variant={active ? 'secondary' : 'ghost'} size="s">
              <Icon size={16} style={{ marginRight: tokens.space.xxs }} />
              <span>{item.label}</span>
              {badgeCount > 0 && (
                <Badge variant="danger">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </Badge>
              )}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
