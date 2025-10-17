import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface PaywallOverlayProps {
  moduleKey?: string;
  featureId?: string;
}

export function PaywallOverlay({ moduleKey, featureId }: PaywallOverlayProps) {
  const title = moduleKey 
    ? `Upgrade to access ${moduleKey.replace('_', ' ')}`
    : featureId
    ? `Upgrade to use ${featureId}`
    : 'Upgrade Required';

  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          This feature is available on our Pro plan
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button>
          View Plans
        </Button>
      </CardContent>
    </Card>
  );
}
