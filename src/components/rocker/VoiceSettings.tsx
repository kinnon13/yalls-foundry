import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Phone, Mic, Volume2 } from 'lucide-react';

const OPENAI_VOICES = [
  { id: 'alloy', name: 'Alloy' },
  { id: 'echo', name: 'Echo' },
  { id: 'fable', name: 'Fable' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'nova', name: 'Nova' },
  { id: 'shimmer', name: 'Shimmer' },
];

export function VoiceSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    allow_voice_calls: false,
    allow_voice_messages: true,
    preferred_voice: 'alloy',
    phone_number: '',
    quiet_hours_start: '22:00',
    quiet_hours_end: '07:00',
    max_call_duration_minutes: 15,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('voice_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          allow_voice_calls: data.allow_voice_calls,
          allow_voice_messages: data.allow_voice_messages,
          preferred_voice: data.preferred_voice,
          phone_number: data.phone_number || '',
          quiet_hours_start: data.quiet_hours_start || '22:00',
          quiet_hours_end: data.quiet_hours_end || '07:00',
          max_call_duration_minutes: data.max_call_duration_minutes,
        });
      }
    } catch (error: any) {
      console.error('Error loading voice settings:', error);
      toast.error('Failed to load voice settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('voice_preferences')
        .upsert({
          user_id: user.id,
          ...settings,
        });

      if (error) throw error;

      toast.success('Voice settings saved');
    } catch (error: any) {
      console.error('Error saving voice settings:', error);
      toast.error('Failed to save voice settings');
    } finally {
      setSaving(false);
    }
  };

  const testVoiceMessage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('rocker-voice-call', {
        body: {
          action: 'send_voice_message',
          message: 'This is a test voice message from Rocker. If you can hear this, your voice settings are working correctly.',
        },
      });

      if (error) throw error;

      toast.success('Voice message generated! Check the audio player below.');
      
      // Play the audio
      if (data.audio_url) {
        const audio = new Audio(data.audio_url);
        audio.play();
      }
    } catch (error: any) {
      console.error('Test voice message error:', error);
      toast.error('Failed to generate test voice message');
    }
  };

  if (loading) {
    return <div>Loading voice settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Settings
        </CardTitle>
        <CardDescription>
          Configure how Rocker can communicate with you via voice
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Allow Voice Calls
              </Label>
              <p className="text-sm text-muted-foreground">
                Let Rocker call you for urgent approvals
              </p>
            </div>
            <Switch
              checked={settings.allow_voice_calls}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allow_voice_calls: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Allow Voice Messages
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive voice messages from Rocker
              </p>
            </div>
            <Switch
              checked={settings.allow_voice_messages}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allow_voice_messages: checked })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (for calls)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1234567890"
            value={settings.phone_number}
            onChange={(e) =>
              setSettings({ ...settings, phone_number: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice">Preferred Voice</Label>
          <Select
            value={settings.preferred_voice}
            onValueChange={(value) =>
              setSettings({ ...settings, preferred_voice: value })
            }
          >
            <SelectTrigger id="voice">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPENAI_VOICES.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quiet-start">Quiet Hours Start</Label>
            <Input
              id="quiet-start"
              type="time"
              value={settings.quiet_hours_start}
              onChange={(e) =>
                setSettings({ ...settings, quiet_hours_start: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quiet-end">Quiet Hours End</Label>
            <Input
              id="quiet-end"
              type="time"
              value={settings.quiet_hours_end}
              onChange={(e) =>
                setSettings({ ...settings, quiet_hours_end: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Max Call Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="1"
            max="60"
            value={settings.max_call_duration_minutes}
            onChange={(e) =>
              setSettings({
                ...settings,
                max_call_duration_minutes: parseInt(e.target.value) || 15,
              })
            }
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          <Button onClick={testVoiceMessage} variant="outline">
            Test Voice Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
