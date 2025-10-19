import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

type AppRole = 'admin' | 'moderator' | 'user';

export function useRoleGuard(requiredRole?: AppRole) {
  const { session } = useSession();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!session?.userId) {
        navigate('/auth?mode=login');
        return;
      }

      if (!requiredRole) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: session.userId,
          _role: requiredRole
        });

        if (error) throw error;

        if (!data) {
          navigate('/');
          return;
        }

        setHasAccess(true);
      } catch (error) {
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [session, requiredRole, navigate]);

  return { hasAccess, isLoading };
}
