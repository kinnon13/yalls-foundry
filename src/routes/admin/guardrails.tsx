import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield, AlertTriangle, Ban, Target } from 'lucide-react';

interface GuardrailSettings {
  civic_integrity_enabled: boolean;
  toxicity_filter_enabled: boolean;
  harm_prevention_enabled: boolean;
  manipulation_detection_enabled: boolean;
}

export default function GuardrailsControl() {
  const { session } = useSession();
  const [settings, setSettings] = useState<GuardrailSettings>({
    civic_integrity_enabled: true,
    toxicity_filter_enabled: true,
    harm_prevention_enabled: true,
    manipulation_detection_enabled: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [session?.userId]);

  async function loadSettings() {
    if (!session?.userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_guardrail_settings', { p_user_id: session.userId });

      if (error) throw error;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const guardData = data as Record<string, boolean>;
        setSettings({
          civic_integrity_enabled: guardData.civic_integrity_enabled ?? true,
          toxicity_filter_enabled: guardData.toxicity_filter_enabled ?? true,
          harm_prevention_enabled: guardData.harm_prevention_enabled ?? true,
          manipulation_detection_enabled: guardData.manipulation_detection_enabled ?? true,
        });
      }
    } catch (error: any) {
      console.error('Load settings error:', error);
      toast.error('Failed to load guardrail settings');
    } finally {
      setLoading(false);
    }
  }

  async function updateSetting(key: keyof GuardrailSettings, value: boolean) {
    if (!session?.userId) return;

    try {
      const { error } = await supabase
        .from('super_admin_guardrails')
        .upsert({
          user_id: session.userId,
          [key]: value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Guardrail setting updated');
    } catch (error: any) {
      console.error('Update setting error:', error);
      toast.error('Failed to update setting');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Rocker Guardrails</h1>
        <p className="text-muted-foreground">
          Super Admin controls for AI safety boundaries. Changes affect your Rocker instance only.
        </p>
      </div>

      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <strong className="text-destructive">Warning:</strong> Disabling guardrails removes safety boundaries.
          Use responsibly and only for authorized testing/research.
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Civic Integrity Protection
            </CardTitle>
            <CardDescription>
              Prevents political persuasion, election manipulation, and voting influence attempts.
              Rocker will refuse to engage in partisan advocacy or targeted political messaging.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="civic-integrity" className="flex-1 cursor-pointer">
                {settings.civic_integrity_enabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id="civic-integrity"
                checked={settings.civic_integrity_enabled}
                onCheckedChange={(checked) => updateSetting('civic_integrity_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5" />
              Toxicity Filter
            </CardTitle>
            <CardDescription>
              Blocks harassment, hate speech, threats, and abusive language.
              Protects users from harmful content in conversations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="toxicity-filter" className="flex-1 cursor-pointer">
                {settings.toxicity_filter_enabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id="toxicity-filter"
                checked={settings.toxicity_filter_enabled}
                onCheckedChange={(checked) => updateSetting('toxicity_filter_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Harm Prevention
            </CardTitle>
            <CardDescription>
              Refuses guidance on violence, self-harm, illegal activities, fraud, or dangerous behavior.
              Maintains ethical boundaries on sensitive topics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="harm-prevention" className="flex-1 cursor-pointer">
                {settings.harm_prevention_enabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id="harm-prevention"
                checked={settings.harm_prevention_enabled}
                onCheckedChange={(checked) => updateSetting('harm_prevention_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Manipulation Detection
            </CardTitle>
            <CardDescription>
              Identifies and blocks social engineering, phishing attempts, and deceptive patterns.
              Protects users from exploitation through conversation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="manipulation-detection" className="flex-1 cursor-pointer">
                {settings.manipulation_detection_enabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id="manipulation-detection"
                checked={settings.manipulation_detection_enabled}
                onCheckedChange={(checked) => updateSetting('manipulation_detection_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">How Guardrails Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>Regular users and admins:</strong> Always protected by all guardrails.</p>
          <p>• <strong>Super admins only:</strong> Can toggle individual guardrails for testing/research.</p>
          <p>• <strong>Audit trail:</strong> All guardrail changes and sensitive requests are logged.</p>
          <p>• <strong>Default state:</strong> All guardrails enabled for maximum safety.</p>
        </CardContent>
      </Card>
    </div>
  );
}
