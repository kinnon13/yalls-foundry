/**
 * Rocker Mode Banner
 * 
 * Displays the current actor role (user vs admin) with visual distinction
 */

import { Shield, User, Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRockerGlobal } from '@/lib/ai/rocker/context';
import { AI_PROFILES } from '@/lib/ai/rocker/config';

export function RockerModeBanner() {
  const { actorRole } = useRockerGlobal();
  const profile = AI_PROFILES[actorRole];

  const iconMap = {
    user: User,
    admin: Shield,
    knower: Brain,
  };

  const Icon = iconMap[actorRole];

  const variantMap = {
    user: 'secondary' as const,
    admin: 'destructive' as const,
    knower: 'default' as const,
  };

  return (
    <Badge variant={variantMap[actorRole]} className="gap-1.5 px-3 py-1">
      <Icon className="h-3.5 w-3.5" />
      {profile.displayName}
    </Badge>
  );
}
