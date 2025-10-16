/**
 * Rocker Labels Panel (Admin Only)
 * Toggle debug labels for Rocker AI interactions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function RockerLabelsPanel() {
  const [showLabels, setShowLabels] = useState(() => {
    return localStorage.getItem('rocker_debug_labels') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('rocker_debug_labels', String(showLabels));
    // Dispatch event for rocker components to listen to
    window.dispatchEvent(new CustomEvent('rocker:labels:toggle', { detail: showLabels }));
  }, [showLabels]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {showLabels ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          Rocker Debug Labels
        </CardTitle>
        <CardDescription>
          Show/hide AI capability labels on user interface elements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch 
            id="rocker-labels" 
            checked={showLabels}
            onCheckedChange={setShowLabels}
          />
          <Label htmlFor="rocker-labels">
            {showLabels ? 'Labels visible' : 'Labels hidden'}
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          When enabled, Rocker-enhanced elements will show visual indicators to help debug AI interactions.
        </p>
      </CardContent>
    </Card>
  );
}