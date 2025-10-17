import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { getHeaderNav, type NavItem } from '@/lib/nav/getNav';
import { MessageSquare, Mail, Users } from 'lucide-react';
import { Button } from '@/design/components/Button';
import { Badge } from '@/design/components/Badge';
import { tokens } from '@/design/tokens';

const iconMap: Record<string, any> = {
  MessageSquare,
  Mail,
  Users,
};

export default function GlobalNav() {
  const { session } = useSession();
  const [items, setItems] = useState<NavItem[]>([]);
  const loc = useLocation();

  useEffect(() => {
    (async () => {
      const nav = await getHeaderNav(session?.userId);
      setItems(nav);
    })();
  }, [session?.userId, loc.pathname]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.space.xs }}>
      {items.map(item => {
        const active = loc.pathname.startsWith(item.path);
        const Icon = item.icon ? iconMap[item.icon] : null;
        
        return (
          <Link key={item.key} to={item.path}>
            <Button variant={active ? 'secondary' : 'ghost'} size="s">
              {Icon && <Icon size={16} style={{ marginRight: tokens.space.xxs }} />}
              <span>{item.label}</span>
              {!!item.badgeCount && item.badgeCount > 0 && (
                <Badge variant="danger">
                  {item.badgeCount > 99 ? '99+' : item.badgeCount}
                </Badge>
              )}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
