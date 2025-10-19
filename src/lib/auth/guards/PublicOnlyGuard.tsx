/**
 * PublicOnly Guard Component
 * 
 * Redirects authenticated users away from auth pages to home
 */

import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function PublicOnlyGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/home?tab=for-you', { replace: true });
      }
    });
  }, [navigate]);

  return <Outlet />;
}
