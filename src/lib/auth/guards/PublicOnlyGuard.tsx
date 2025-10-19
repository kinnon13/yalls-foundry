/**
 * PublicOnly Guard Component
 * 
 * Redirects authenticated users away from auth pages to home
 */

import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function PublicOnlyGuard() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const params = new URLSearchParams(location.search);
        const mode = params.get('mode');
        // Allow password reset/update flows to render even if a session exists
        if (location.pathname.startsWith('/auth') && ['reset', 'update-password'].includes(mode || '')) {
          return; // Do not redirect
        }
        navigate('/home?tab=for-you', { replace: true });
      }
    });
  }, [navigate, location.pathname, location.search]);

  return <Outlet />;
}
