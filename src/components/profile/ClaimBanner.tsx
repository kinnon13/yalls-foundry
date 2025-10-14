/**
 * Claim Banner Component
 * 
 * Shows claim button for unclaimed profiles when user has permission.
 */

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Can } from '@/lib/auth/guards';
import { Info } from 'lucide-react';

interface ClaimBannerProps {
  isClaimed: boolean;
  onClaim: () => void;
}

export function ClaimBanner({ isClaimed, onClaim }: ClaimBannerProps) {
  if (isClaimed) return null;
  
  return (
    <Can action="claim" subject="profile.claim">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>This profile is unclaimed. Claim it to manage it.</span>
          <Button onClick={onClaim} size="sm">
            Claim Profile
          </Button>
        </AlertDescription>
      </Alert>
    </Can>
  );
}
