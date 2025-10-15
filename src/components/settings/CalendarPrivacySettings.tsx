import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock, Globe, Eye, EyeOff } from 'lucide-react';

export function CalendarPrivacySettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calendarPublic, setCalendarPublic] = useState(false);
  const [showBusyOnly, setShowBusyOnly] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Using any to bypass type check until types regenerate
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('calendar_public, calendar_settings')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCalendarPublic(data.calendar_public || false);
        const settings = data.calendar_settings || {};
        setShowBusyOnly(settings.show_busy_only || false);
        setHideDetails(settings.hide_details || false);
      }
    } catch (error) {
      console.error('Failed to load calendar settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calendar settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          calendar_public: calendarPublic,
          calendar_settings: {
            show_busy_only: showBusyOnly,
            hide_details: hideDetails,
            allowed_viewers: [],
          },
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your calendar privacy settings have been updated',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save calendar settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Calendar Privacy
        </CardTitle>
        <CardDescription>
          Control who can see your calendar and event details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Public Calendar
            </Label>
            <p className="text-sm text-muted-foreground">
              Allow anyone to view your calendar
            </p>
          </div>
          <Switch
            checked={calendarPublic}
            onCheckedChange={setCalendarPublic}
          />
        </div>

        {calendarPublic && (
          <>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Show Busy Blocks Only
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show when you're busy without revealing event details
                </p>
              </div>
              <Switch
                checked={showBusyOnly}
                onCheckedChange={setShowBusyOnly}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Hide Event Details
                </Label>
                <p className="text-sm text-muted-foreground">
                  Show event times but hide titles and descriptions
                </p>
              </div>
              <Switch
                checked={hideDetails}
                onCheckedChange={setHideDetails}
              />
            </div>
          </>
        )}

        <Button onClick={saveSettings} disabled={saving} className="w-full">
          {saving ? 'Saving...' : 'Save Privacy Settings'}
        </Button>

        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Privacy Summary</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • Calendar is <strong>{calendarPublic ? 'PUBLIC' : 'PRIVATE'}</strong>
            </li>
            {calendarPublic && (
              <>
                <li>
                  • Details: {showBusyOnly ? 'Busy blocks only' : hideDetails ? 'Times only' : 'Full details'}
                </li>
              </>
            )}
            {!calendarPublic && (
              <li>
                • Only you can see your calendar events
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
