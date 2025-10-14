/**
 * Development Navigation
 * 
 * Temporary navigation component showing admin/debug links.
 * Only visible in development mode.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function DevNav() {
  // Only show in dev mode
  if (import.meta.env.PROD) return null;

  return (
    <nav className="fixed top-4 right-4 z-50">
      <Link to="/admin/control-room">
        <Button variant="outline" size="sm">
          Admin (Dev Only)
        </Button>
      </Link>
    </nav>
  );
}
