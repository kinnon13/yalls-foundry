import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { getHeaderNav, type NavItem } from '@/lib/nav/getNav';
import { MessageSquare, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <div className="flex items-center gap-1">
      {items.map(item => {
        const active = loc.pathname.startsWith(item.path);
        const Icon = item.icon ? iconMap[item.icon] : null;
        
        return (
          <Link
            key={item.key}
            to={item.path}
            className="relative"
          >
            <Button
              variant={active ? 'secondary' : 'ghost'}
              size="sm"
              className="relative"
            >
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              <span>{item.label}</span>
              {!!item.badgeCount && item.badgeCount > 0 && (
                <Badge 
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
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
