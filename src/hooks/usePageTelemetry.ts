import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startPageView, endPageView } from '@/lib/telemetry';

export function usePageTelemetry() {
  const { pathname, search } = useLocation();
  
  useEffect(() => {
    endPageView();
    startPageView(pathname + search);
    return () => endPageView();
  }, [pathname, search]);
}
