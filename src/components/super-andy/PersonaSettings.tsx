/**
 * Persona Settings (Experimental)
 * Super Andy can toggle dynamic persona customization
 * When OFF (default): locked voices (onyx/nova/alloy)
 * When ON: enables org/user voice & name overrides
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { STATIC_VOICE_PROFILES } from '@/config/voiceProfiles';

export function PersonaSettings() {
  const [isDynamicEnabled, setIsDynamicEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadFlag = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_feature_flag', { flag_key: 'dynamic_personas_enabled' });
        
        if (error) throw error;
        setIsDynamicEnabled(data ?? false);
      } catch (error) {
        console.error('Failed to load feature flag:', error);
        toast({
          title: 'Failed to load settings',
          description: 'Using default configuration',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFlag();
  }, [toast]);

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .rpc('set_feature_flag', { 
          flag_key: 'dynamic_personas_enabled', 
          flag_enabled: enabled 
        });
      
      if (error) throw error;
      
      setIsDynamicEnabled(enabled);
      toast({
        title: enabled ? 'Dynamic personas enabled' : 'Dynamic personas disabled',
        description: enabled 
          ? 'Voice and name overrides are now active. Refresh to see changes.'
          : 'Using locked default profiles (onyx/nova/alloy).',
      });
    } catch (error: any) {
      console.error('Failed to toggle feature flag:', error);
      toast({
        title: 'Failed to update setting',
        description: error.message || 'Only super admins can modify feature flags',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Persona Customization
          </CardTitle>
          <CardDescription>
            Loading settings...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Persona Customization
          <Badge variant="outline" className="ml-2">Experimental</Badge>
        </CardTitle>
        <CardDescription>
          Enable dynamic voice and name customization per organization and user
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dynamic-personas" className="text-base">
              Dynamic Persona System
            </Label>
            <p className="text-sm text-muted-foreground">
              {isDynamicEnabled 
                ? 'Voice & name overrides are active' 
                : 'Using locked defaults (onyx/nova/alloy)'}
            </p>
          </div>
          <Switch
            id="dynamic-personas"
            checked={isDynamicEnabled}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>

        {/* Current profiles display */}
        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm font-medium">Current Voice Profiles</p>
          <div className="space-y-2">
            {Object.entries(STATIC_VOICE_PROFILES).map(([key, profile]) => (
              <div 
                key={key}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div>
                  <p className="text-sm font-medium">{profile.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.voice} @ {profile.rate}×
                  </p>
                </div>
                <Badge variant={isDynamicEnabled ? 'default' : 'secondary'}>
                  {isDynamicEnabled ? 'Customizable' : 'Locked'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Info message */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            {isDynamicEnabled ? (
              <>
                <strong>Dynamic mode active:</strong> Organizations and users can now customize 
                voice profiles. Changes apply immediately via Realtime.
              </>
            ) : (
              <>
                <strong>Static mode (default):</strong> All users get the same locked voices. 
                Enable dynamic mode to allow per-org and per-user customization.
              </>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
