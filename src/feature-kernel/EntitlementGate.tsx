/**
 * EntitlementGate - Wraps feature islands with paywall logic
 * 
 * Checks user's entitlements; if missing, shows upgrade prompt.
 * Logs gate hits for analytics.
 */

import { useEntitlements } from '@/hooks/use-entitlements';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface EntitlementGateProps {
  featureId: string;
  requires?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function EntitlementGate({
  featureId,
  requires,
  children,
  fallback,
}: EntitlementGateProps) {
  const { has } = useEntitlements();
  const allowed = has(requires);

  if (!allowed) {
    // Non-blocking telemetry (fire-and-forget)
    if (import.meta.env.PROD) {
      (supabase as any)
        .rpc('rpc_observe', {
          p_rpc_name: 'gate_hit',
          p_duration_ms: 0,
          p_status: 'noop',
          p_error_code: null,
          p_meta: { featureId, surface: 'entitlements' },
        })
        .catch(() => void 0);
    }

    return fallback ?? <DefaultPaywall featureId={featureId} />;
  }

  return <>{children}</>;
}

function DefaultPaywall({ featureId }: { featureId: string }) {
  const handleUpgrade = () => {
    window.location.href = `/billing?upgrade=pro&f=${encodeURIComponent(featureId)}`;
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>Upgrade Required</CardTitle>
        <CardDescription>
          Unlock <span className="font-semibold">{featureId}</span> on the Pro plan
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={handleUpgrade}>
          Upgrade to Pro
        </Button>
      </CardContent>
    </Card>
  );
}
