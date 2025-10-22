/**
 * Navigation Component
 * Role-aware sidebar navigation
 */

import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

export function Nav() {
  const { session } = useSession();
  const location = useLocation();
  const [role, setRole] = useState<'user' | 'admin' | 'super'>('user');

  useEffect(() => {
    async function checkRole() {
      if (!session?.userId) return;

      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('user_id')
        .eq('user_id', session.userId)
        .maybeSingle();

      setRole(superAdmin ? 'super' : 'user');
    }

    checkRole();
  }, [session]);

  const isActive = (path: string) => {
    // Handle query param routes (overlays)
    if (path.includes('?app=')) {
      const appParam = new URLSearchParams(path.split('?')[1]).get('app');
      const currentAppParam = new URLSearchParams(location.search).get('app');
      return appParam === currentAppParam;
    }
    // Handle regular routes
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const linkClass = (path: string) => cn(
    "block px-3 py-2 rounded-md text-sm transition-colors",
    isActive(path) 
      ? "bg-primary text-primary-foreground" 
      : "hover:bg-accent hover:text-accent-foreground"
  );

  return (
    <nav className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Workspace</h3>
        <div className="space-y-1">
          <Link to="/dashboard?app=yallbrary" className={linkClass('/dashboard?app=yallbrary')} data-testid="nav-yallbrary">
            Yallbrary
          </Link>
          <Link to="/dashboard?app=andy" className={linkClass('/dashboard?app=andy')} data-testid="nav-andy">
            Super Andy
          </Link>
          <Link to="/dashboard?app=rocker" className={linkClass('/dashboard?app=rocker')} data-testid="nav-rocker">
            User Rocker
          </Link>
        </div>
      </div>

      {(role === 'admin' || role === 'super') && (
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Admin Rocker</h3>
          <div className="space-y-1">
            <Link to="/admin-rocker" className={linkClass('/admin-rocker')} data-testid="nav-admin-rocker">
              Overview
            </Link>
          </div>
        </div>
      )}

      {role === 'super' && (
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Super Console</h3>
          <div className="space-y-1">
            <Link to="/super" className={linkClass('/super')} data-testid="nav-super">
              Overview
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
