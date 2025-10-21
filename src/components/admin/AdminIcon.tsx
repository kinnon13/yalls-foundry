/**
 * Admin Icon Component
 * Only visible to users with admin role
 */

import { Shield, Crown } from 'lucide-react';
import { useSuperAdminCheck } from '@/hooks/useSuperAdminCheck';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AdminIcon({ className = "" }: { className?: string }) {
  const { isSuperAdmin } = useSuperAdminCheck();

  if (!isSuperAdmin) return null;

  return (
    <Link to="/admin">
      <Button variant="ghost" size="icon" className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-400 to-red-500 rounded-full blur-md opacity-60" />
        <div className="relative bg-gradient-to-br from-amber-600 via-amber-500 to-orange-400 rounded-full p-2">
          <Shield className="h-5 w-5 text-white" />
          <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-200" />
        </div>
      </Button>
    </Link>
  );
}
