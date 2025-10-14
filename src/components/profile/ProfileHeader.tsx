/**
 * Profile Header Component
 * 
 * Displays profile name and basic metadata.
 */

import { Badge } from '@/components/ui/badge';
import type { AnyProfile } from '@/lib/profiles/types';

interface ProfileHeaderProps {
  profile: AnyProfile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-bold">{profile.name}</h1>
        <Badge variant="outline" className="capitalize">
          {profile.type}
        </Badge>
        {profile.is_claimed && (
          <Badge variant="default">Claimed</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        ID: {profile.id}
      </p>
    </div>
  );
}
