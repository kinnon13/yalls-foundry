/**
 * Unknowns Panel - Items Rocker doesn't understand yet
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export function UnknownsPanel() {
  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle>Unknown Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">No unknowns yet 🎉</p>
          <p className="text-xs text-muted-foreground mt-2">
            When Rocker encounters something he doesn't understand, it'll appear here for you to resolve.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
