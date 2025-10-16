/**
 * Redirect Handler
 * 
 * Automatically redirects legacy routes to their new canonical paths
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyRedirect } from '@/lib/navigation/redirects';

export function RedirectHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    applyRedirect(location.pathname, location.search, navigate);
  }, [location.pathname, location.search, navigate]);

  return null;
}
