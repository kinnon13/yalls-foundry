/**
 * RequireOnboarding Guard
 * Redirects incomplete profiles to /onboarding
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export function RequireOnboardingGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, [location.pathname]);

  const checkOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Not authenticated - let auth guard handle it
        setChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile || profile.onboarding_complete === false) {
        // Redirect to onboarding (unless already there)
        if (!location.pathname.startsWith('/onboarding')) {
          navigate('/onboarding', { replace: true });
          return;
        }
      }

      setChecked(true);
    } catch (err) {
      console.error('[RequireOnboardingGuard] Error:', err);
      setChecked(true);
    }
  };

  if (!checked) return null;

  return <Outlet />;
}
