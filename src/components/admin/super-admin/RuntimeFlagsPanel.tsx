/**
 * Runtime Flags Panel - Super Admin Only
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Flag, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RuntimeFlag {
  key: string;
  value: any;
}

export function RuntimeFlagsPanel() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<RuntimeFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      const { data, error } = await supabase
        .from('runtime_flags')
        .select('key, value')
        .order('key');

      if (error) throw error;
      setFlags(data || []);
    } catch (error) {
      console.error('Failed to load flags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load runtime flags',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (key: string, currentValue: any) => {
    try {
      const newEnabled = !currentValue.enabled;
      
      const { error } = await supabase
        .from('runtime_flags')
        .update({ 
          value: { ...currentValue, enabled: newEnabled }
        })
        .eq('key', key);

      if (error) throw error;

      setFlags(flags.map(f => 
        f.key === key ? { ...f, value: { ...f.value, enabled: newEnabled } } : f
      ));

      toast({
        title: 'Updated',
        description: `${key} ${newEnabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Failed to toggle flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flag',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading flags...</div>;
  }

  const safeMode = flags.find(f => f.key === 'global.safe_mode');
  const otherFlags = flags.filter(f => f.key !== 'global.safe_mode');

  return (
    <div className="space-y-6">
      {safeMode && (
        <Alert variant={safeMode.value?.enabled ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Safe Mode:</strong> {safeMode.value?.enabled ? 'ACTIVE - All AI features disabled' : 'Inactive'}
            </div>
            <Switch
              checked={safeMode.value?.enabled || false}
              onCheckedChange={() => toggleFlag('global.safe_mode', safeMode.value)}
            />
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Runtime Flags
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {otherFlags.map((flag) => (
            <div key={flag.key} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-mono text-sm">{flag.key}</Label>
                <p className="text-xs text-muted-foreground">
                  {JSON.stringify(flag.value, null, 2)}
                </p>
              </div>
              {typeof flag.value === 'object' && 'enabled' in flag.value && (
                <Switch
                  checked={flag.value.enabled || false}
                  onCheckedChange={() => toggleFlag(flag.key, flag.value)}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
