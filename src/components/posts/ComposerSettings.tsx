import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function ComposerSettings() {
  const [enabled, setEnabled] = useState(
    localStorage.getItem('rocker-suggestions-enabled') === 'true'
  );

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    localStorage.setItem('rocker-suggestions-enabled', String(checked));
  };

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
