import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface EntityClaimBannerProps {
  entityId: string;
  status: 'unclaimed' | 'claimed' | 'verified';
  provenance?: {
    source?: string;
    source_id?: string;
    url?: string;
    import_batch_id?: string;
  };
  onClaim?: () => void;
}

export function EntityClaimBanner({ entityId, status, provenance, onClaim }: EntityClaimBannerProps) {
  const [windowStatus, setWindowStatus] = useState<{ expires_at: string; days_left: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'unclaimed') {
      supabase.rpc('contributor_window_status', { p_entity_id: entityId })
        .then(({ data }) => {
          if (data && typeof data === 'object') {
            setWindowStatus(data as { expires_at: string; days_left: number });
          }
        });
    }
  }, [entityId, status]);

  if (status !== 'unclaimed') return null;

  const handleClaim = () => {
    if (onClaim) {
      onClaim();
    } else {
      navigate(`/claim/${entityId}`);
    }
  };

  return (
    <Alert className="border-warning bg-warning/10">
      <Info className="h-4 w-4" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="border-warning text-warning">
              Unclaimed
            </Badge>
            {windowStatus && windowStatus.days_left > 0 && (
              <span className="text-sm flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {windowStatus.days_left} days left to claim with contributor credit
              </span>
            )}
          </div>
          {provenance && (
            <p className="text-xs text-muted-foreground">
              Source: {provenance.source || 'Unknown'}
              {provenance.import_batch_id && ` • Batch: ${provenance.import_batch_id}`}
            </p>
          )}
        </div>
        <Button onClick={handleClaim} size="sm" className="whitespace-nowrap">
          Claim This Profile
        </Button>
      </AlertDescription>
    </Alert>
  );
}
