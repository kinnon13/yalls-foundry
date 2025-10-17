/**
 * Earnings Feature
 * 
 * Standalone earnings tracking feature
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { X } from 'lucide-react';
import type { FeatureProps } from '@/feature-kernel/types';

interface EarningsFeatureProps extends FeatureProps {
  tab?: 'summary' | 'missed' | 'history';
  featureId: string;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

export default function EarningsFeature({
  tab = 'summary',
  featureId,
  updateProps,
  close,
}: EarningsFeatureProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Earnings</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['summary', 'missed', 'history'] as const).map((t) => (
                <Button
                  key={t}
                  variant={tab === t ? 'secondary' : 'ghost'}
                  size="s"
                  onClick={() => updateProps({ tab: t })}
                >
                  {t}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="s" onClick={close}>
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-2">Earnings {tab}</p>
          <p className="text-xs mt-4">Full earnings implementation coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
