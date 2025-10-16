import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const PREVIEW_ENABLED = import.meta.env.VITE_PREVIEW_ENABLED === 'true';

/**
 * PreviewGuard - Security wrapper for preview routes
 * - Checks env flag and admin access
 * - Blocks write operations (POST/PUT/PATCH/DELETE)
 * - Only allows in dev/staging with proper auth
 */
export function PreviewGuard() {
  const { isAdmin, isLoading } = useAdminCheck();

  useEffect(() => {
    // Intercept fetch to block writes from preview pages
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [input, init] = args;
      const method = init?.method?.toUpperCase() || 'GET';
      
      // Block mutations from preview routes
      if (window.location.pathname.startsWith('/preview') && 
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        console.error('[PreviewGuard] Write operation blocked:', method, input);
        throw new Error('Write operations are blocked in preview mode');
      }
      
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Gate: env flag must be on
  if (!PREVIEW_ENABLED) {
    return <Navigate to="/" replace />;
  }

  // Gate: must be admin
  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Checking access...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
