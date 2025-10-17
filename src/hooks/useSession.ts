import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSession() {
  const [session, setSession] = useState<{ userId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      setSession(authSession ? { userId: authSession.user.id } : null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, authSession) => {
      setSession(authSession ? { userId: authSession.user.id } : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}
