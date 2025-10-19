/**
 * Demo Mode Controls (for Dev HUD)
 * Toggle demo mode and reset demo data
 */

import { useState, useEffect } from 'react';
import { isDemo } from '@/lib/env';
import { resetDemoData } from '@/lib/demo/storage';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DemoModeControls() {
  const [demoActive, setDemoActive] = useState(isDemo());
  const { toast } = useToast();
  
  useEffect(() => {
    setDemoActive(isDemo());
  }, []);
  
  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(window.location.search);
    if (checked) {
      params.set('demo', '1');
    } else {
      params.delete('demo');
    }
    window.location.search = params.toString();
  };
  
  const handleReset = () => {
    resetDemoData();
    toast({
      title: 'Demo data reset',
      description: 'All demo storage cleared to initial fixtures',
    });
    window.location.reload();
  };
  
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <Label htmlFor="demo-toggle" className="font-semibold">Demo Mode</Label>
        </div>
        <Switch
          id="demo-toggle"
          checked={demoActive}
          onCheckedChange={handleToggle}
        />
      </div>
      
      {demoActive && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            All data is mocked. Cart, messages, and pins saved to localStorage.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            className="w-full gap-2"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Demo Data
          </Button>
        </div>
      )}
    </div>
  );
}
