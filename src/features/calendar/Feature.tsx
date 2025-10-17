/**
 * Calendar Feature
 * 
 * Standalone calendar view feature
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/design/components/Button';
import { X } from 'lucide-react';
import type { FeatureProps } from '@/feature-kernel/types';

interface CalendarFeatureProps extends FeatureProps {
  view?: 'public' | 'private';
  range?: string;
  featureId: string;
  updateProps: (updates: Partial<FeatureProps>) => void;
  close: () => void;
}

export default function CalendarFeature({
  view = 'public',
  range = '30d',
  featureId,
  updateProps,
  close,
}: CalendarFeatureProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendar</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <Button
                variant={view === 'public' ? 'secondary' : 'ghost'}
                size="s"
                onClick={() => updateProps({ view: 'public' })}
              >
                Public
              </Button>
              <Button
                variant={view === 'private' ? 'secondary' : 'ghost'}
                size="s"
                onClick={() => updateProps({ view: 'private' })}
              >
                Private
              </Button>
            </div>
            <Button variant="ghost" size="s" onClick={close}>
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-2">Calendar View: {view}</p>
          <p className="text-sm">Range: {range}</p>
          <p className="text-xs mt-4">Full calendar implementation coming soon</p>
        </div>
      </CardContent>
    </Card>
  );
}
