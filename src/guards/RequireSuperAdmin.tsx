import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Navigate } from 'react-router-dom';

export default function RequireSuperAdmin({ children }: { children: JSX.Element }) {
  const [ok, setOk] = useState<null | boolean>(null);
  
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setOk(false);
      
      const { data } = await supabase
        .from('super_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setOk(!!data);
    })();
  }, []);
  
  if (ok === null) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  return ok ? children : <Navigate to="/" replace />;
}
