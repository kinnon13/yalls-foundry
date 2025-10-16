import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getFlag } from '@/lib/flags';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export function ComposerSettings() {
  const [enabled, setEnabled] = useState(
    localStorage.getItem('rocker-suggestions-enabled') === 'true'
  );
  const [globalEnabled, setGlobalEnabled] = useState(true);

  useEffect(() => {
    setGlobalEnabled(getFlag('composer_coach'));
  }, []);

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem('rocker-suggestions-enabled', String(checked));
  };

  if (!globalEnabled) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Live Writing Coach is currently disabled by your administrator.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex items-center justify-between space-x-2">
      <Label htmlFor="live-coach" className="flex flex-col space-y-1">
        <span>Live Writing Coach</span>
        <span className="font-normal text-sm text-muted-foreground">
          Get AI-powered suggestions while composing (idle-only, private)
        </span>
      </Label>
      <Switch
        id="live-coach"
        checked={enabled}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}
