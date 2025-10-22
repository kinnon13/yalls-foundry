/**
 * Legacy Redirector
 * Catches all unmapped routes and redirects to dashboard with ?app= parameter
 * Preserves query strings and provides graceful fallback
 */

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Map legacy paths/prefixes → app keys
const RULES: Array<{ re: RegExp; app: string }> = [
  { re: /^\/(yallbrary|marketplace)(\/|$)/i, app: 'yallbrary' },
  { re: /^\/messages(\/|$)/i,               app: 'messages' },
  { re: /^\/orders(\/|$)/i,                 app: 'orders' },
  { re: /^\/cart(\/|$)/i,                   app: 'cart' },
  { re: /^\/profile(\/|$)/i,                app: 'profile' },
  { re: /^\/entities(\/|$)/i,               app: 'entities' },
  { re: /^\/events(\/|$)/i,                 app: 'events' },
  { re: /^\/mlm(\/|$)/i,                    app: 'mlm' },
  { re: /^\/settings(\/|$)/i,               app: 'settings' },
  { re: /^\/overview(\/|$)/i,               app: 'overview' },
  { re: /^\/notifications(\/|$)/i,          app: 'notifications' },
  { re: /^\/analytics(\/|$)/i,              app: 'analytics' },
  { re: /^\/incentives(\/|$)/i,             app: 'incentives' },
  { re: /^\/(farm|farm-ops)(\/|$)/i,        app: 'farm-ops' },
  { re: /^\/crm(\/|$)/i,                    app: 'crm' },
  { re: /^\/discover(\/|$)/i,               app: 'discover' },
  { re: /^\/listings(\/|$)/i,               app: 'listings' },
  { re: /^\/calendar(\/|$)/i,               app: 'calendar' },
  { re: /^\/rocker(\/|$)/i,                 app: 'rocker' },
  { re: /^\/admin-rocker(\/|$)/i,           app: 'admin-rocker' },
  { re: /^\/super-andy(\/|$)/i,             app: 'andy' },
];

export default function LegacyRedirector() {
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    const m = RULES.find(r => r.re.test(loc.pathname));
    if (m) {
      const q = new URLSearchParams(loc.search);
      q.set('app', m.app);
      nav(`/?${q.toString()}`, { replace: true });
    } else {
      // Hard 404: redirect to home with overview app open
      nav('/?app=overview', { replace: true });
    }
  }, [loc.pathname, loc.search, nav]);

  return null;
}
