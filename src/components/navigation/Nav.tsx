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

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

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
          <Link to="/super-andy" className={linkClass('/super-andy')}>
            Super Andy
          </Link>
          <Link to="/rocker" className={linkClass('/rocker')}>
            User Rocker
          </Link>
        </div>
      </div>

      {(role === 'admin' || role === 'super') && (
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Admin Rocker</h3>
          <div className="space-y-1">
            <Link to="/admin-rocker" className={linkClass('/admin-rocker')}>
              Overview
            </Link>
            <Link to="/admin-rocker/tools" className={linkClass('/admin-rocker/tools')}>
              Tools
            </Link>
            <Link to="/admin-rocker/audits" className={linkClass('/admin-rocker/audits')}>
              Audits
            </Link>
            <Link to="/admin-rocker/moderation" className={linkClass('/admin-rocker/moderation')}>
              Moderation
            </Link>
            <Link to="/admin-rocker/budgets" className={linkClass('/admin-rocker/budgets')}>
              Budgets
            </Link>
          </div>
        </div>
      )}

      {role === 'super' && (
        <div>
          <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Super Console</h3>
          <div className="space-y-1">
            <Link to="/super" className={linkClass('/super')}>
              Overview
            </Link>
            <Link to="/super/pools" className={linkClass('/super/pools')}>
              Pools
            </Link>
            <Link to="/super/workers" className={linkClass('/super/workers')}>
              Workers
            </Link>
            <Link to="/super/flags" className={linkClass('/super/flags')}>
              Flags
            </Link>
            <Link to="/super/incidents" className={linkClass('/super/incidents')}>
              Incidents
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
