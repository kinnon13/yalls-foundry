/**
 * Daily Kickoff Scheduler
 * Configure Rocker's daily morning briefing
 */

import { useState, useEffect } from 'react';
import { Clock, Save, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Phoenix', label: 'Arizona' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
];

export function DailyKickoff() {
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState('09:00');
  const [timezone, setTimezone] = useState('America/Denver');
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rocker_daily_kickoffs')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setEnabled(data.enabled);
        setTime(data.scheduled_time);
        setTimezone(data.timezone);
        setLastRun(data.last_run_at);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('rocker_daily_kickoffs')
        .upsert({
          user_id: user.id,
          scheduled_time: time,
          timezone,
          enabled
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: enabled 
          ? `Rocker will check in daily at ${time} ${timezone.split('/')[1]}`
          : "Daily kickoff disabled"
      });

    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerNow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Log action to trigger kickoff
      await supabase
        .from('ai_action_ledger')
        .insert({
          user_id: user.id,
          agent: 'rocker',
          action: 'daily_kickoff_manual',
          input: { triggered_at: new Date().toISOString() },
          output: { status: 'queued' },
          result: 'success'
        });

      toast({
        title: "Kickoff Started",
        description: "Rocker is preparing your daily brief..."
      });

    } catch (error: any) {
      toast({
        title: "Failed to Start",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Daily Kickoff</h2>
          <p className="text-sm text-muted-foreground">
            Rocker reviews your calendar, inbox, and priorities every morning
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled" className="text-base">Enable Daily Kickoff</Label>
            <p className="text-sm text-muted-foreground">
              Get a morning brief and task recommendations
            </p>
          </div>
          <Switch
            id="enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map(tz => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">What Rocker Does Each Morning:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Reviews your calendar and upcoming meetings</li>
                <li>• Checks inbox for urgent items</li>
                <li>• Suggests top 3 priorities for the day</li>
                <li>• Proposes one focus task to start</li>
                <li>• Offers to start a 25-minute focus sprint</li>
              </ul>
            </div>

            {lastRun && (
              <p className="text-sm text-muted-foreground">
                Last ran: {new Date(lastRun).toLocaleString()}
              </p>
            )}
          </>
        )}

        <div className="flex gap-3">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
          {enabled && (
            <Button
              variant="secondary"
              onClick={triggerNow}
            >
              <Zap className="h-4 w-4 mr-2" />
              Run Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}