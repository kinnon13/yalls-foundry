/**
 * Rocker Mode Banner
 * 
 * Displays the current actor role (user vs admin) with visual distinction
 */

import { Shield, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRockerGlobal } from '@/lib/ai/rocker/context';

export function RockerModeBanner() {
  const { actorRole } = useRockerGlobal();

  if (actorRole === 'admin') {
    return (
      <Badge variant="destructive" className="gap-1.5 px-3 py-1">
        <Shield className="h-3.5 w-3.5" />
        Admin Mode - Powers Active
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 px-3 py-1">
      <User className="h-3.5 w-3.5" />
      User Mode
    </Badge>
  );
}
