/**
 * RequireAuth Guard Component
 * 
 * Redirects unauthenticated users to /auth?mode=login&next=<current_path>
 * Preserves destination path for post-login redirect
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function RequireAuthGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        const currentPath = location.pathname + location.search;
        const nextParam = encodeURIComponent(currentPath);
        navigate(`/auth?mode=login&next=${nextParam}`, { replace: true });
      } else {
        setChecked(true);
      }
    });
  }, [location.pathname, location.search, navigate]);

  // Show nothing while checking (prevents flash)
  if (!checked) return null;

  return <Outlet />;
}
