/**
 * Role Gate Component
 * Guards routes based on user role from super_admins table
 */

import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

type RoleGateProps = {
  allow: Array<'user' | 'admin' | 'super'>;
  children: ReactNode;
};

export function RoleGate({ allow, children }: RoleGateProps) {
  const { session, loading: authLoading } = useSession();
  const [role, setRole] = useState<'user' | 'admin' | 'super' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!session?.userId) {
        setRole(null);
        setLoading(false);
        return;
      }

      // Check if user is super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('user_id')
        .eq('user_id', session.userId)
        .maybeSingle();

      if (superAdmin) {
        setRole('super');
      } else {
        // Default to user role (can be enhanced with user_roles table)
        setRole('user');
      }
      setLoading(false);
    }

    if (!authLoading) {
      checkRole();
    }
  }, [session, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  if (!role || !allow.includes(role)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
