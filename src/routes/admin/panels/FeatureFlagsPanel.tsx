/**
 * Feature Flags Control Panel
 * 
 * Admin UI to enable/disable features in real-time.
 * Changes propagate instantly to all users via Supabase realtime.
 */

import { useState } from 'react';
import { useFeatureFlags, FeatureFlag } from '@/hooks/useFeatureFlags';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Calendar, 
  Mic, 
  BarChart3, 
  Network, 
  Video, 
  CreditCard, 
  Smartphone,
  Loader2,
  RefreshCw
} from 'lucide-react';

const categoryIcons: Record<string, any> = {
  commerce: ShoppingCart,
  scheduling: Calendar,
  ai: Mic,
  analytics: BarChart3,
  business: Network,
  media: Video,
  platform: Smartphone,
};

const categoryColors: Record<string, string> = {
  commerce: 'bg-emerald-500/10 text-emerald-500',
  scheduling: 'bg-blue-500/10 text-blue-500',
  ai: 'bg-purple-500/10 text-purple-500',
  analytics: 'bg-orange-500/10 text-orange-500',
  business: 'bg-pink-500/10 text-pink-500',
  media: 'bg-red-500/10 text-red-500',
  platform: 'bg-cyan-500/10 text-cyan-500',
};

export function FeatureFlagsPanel() {
  const { allFlags, loading } = useFeatureFlags();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const toggleFeature = async (flag: FeatureFlag) => {
    setUpdating(flag.id);
    
    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: !flag.enabled })
      .eq('id', flag.id);

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to update ${flag.name}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: flag.enabled ? 'Feature Disabled' : 'Feature Enabled',
        description: `${flag.name} ${flag.enabled ? 'disabled' : 'enabled'} for all users`,
      });
    }
    
    setUpdating(null);
  };

  const groupedFlags = allFlags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Enable or disable platform features in real-time. Changes apply instantly to all users.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Updates
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {Object.entries(groupedFlags).map(([category, flags]) => {
        const Icon = categoryIcons[category] || RefreshCw;
        const colorClass = categoryColors[category] || 'bg-gray-500/10 text-gray-500';
        
        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg capitalize">{category}</CardTitle>
                  <CardDescription>
                    {flags.length} feature{flags.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold">{flag.name}</h4>
                      {flag.enabled ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                          Enabled
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {flag.description || 'No description available'}
                    </p>
                    {Object.keys(flag.config).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Config: {JSON.stringify(flag.config)}
                      </div>
                    )}
                  </div>
                  
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFeature(flag)}
                    disabled={updating === flag.id}
                    className="ml-4"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">Dynamic Platform</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Features can be toggled without redeployment. All changes propagate instantly via Supabase realtime.
            Add new features to the database to see them appear here automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
