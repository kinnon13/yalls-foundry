import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Clock, Mail, MessageSquare, Smartphone } from 'lucide-react';

interface NotificationPrefs {
  quiet_hours: string; // '[22,8)' format
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: {
    social: boolean;
    orders: boolean;
    events: boolean;
    ai: boolean;
    system: boolean;
    crm: boolean;
  };
  daily_cap: number;
  digest_hour: number;
}

export default function NotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load preferences
  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification_prefs')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Default preferences
      return data || {
        quiet_hours: '[22,8)',
        channels: { in_app: true, email: false, push: false, sms: false },
        categories: { social: true, orders: true, events: true, ai: true, system: true, crm: true },
        daily_cap: 10,
        digest_hour: 9,
      };
    },
  });

  // Update preferences
  const updatePrefs = useMutation({
    mutationFn: async (updates: Partial<NotificationPrefs>) => {
      const { error } = await supabase.rpc('notif_prefs_update', {
        p_quiet_hours: updates.quiet_hours,
        p_channels: updates.channels ? JSON.stringify(updates.channels) : null,
        p_categories: updates.categories ? JSON.stringify(updates.categories) : null,
        p_daily_cap: updates.daily_cap,
        p_digest_hour: updates.digest_hour,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs'] });
      toast({ title: 'Preferences saved' });
    },
    onError: (err) => {
      toast({ title: 'Failed to save', description: String(err), variant: 'destructive' });
    },
  });

  if (isLoading || !prefs) {
    return (
      <div className="space-y-6">
        <div className="h-48 animate-pulse bg-muted rounded-lg" />
        <div className="h-48 animate-pulse bg-muted rounded-lg" />
      </div>
    );
  }

  const parseQuietHours = (range: string): [number, number] => {
    const match = range.match(/\[(\d+),(\d+)\)/);
    return match ? [parseInt(match[1]), parseInt(match[2])] : [22, 8];
  };

  const [quietStart, quietEnd] = parseQuietHours(prefs.quiet_hours);

  const handleQuietHoursChange = (values: number[]) => {
    const [start, end] = values;
    updatePrefs.mutate({ quiet_hours: `[${start},${end})` });
  };

  const handleChannelToggle = (channel: keyof NotificationPrefs['channels']) => {
    updatePrefs.mutate({
      channels: { ...prefs.channels, [channel]: !prefs.channels[channel] },
    });
  };

  const handleCategoryToggle = (category: keyof NotificationPrefs['categories']) => {
    updatePrefs.mutate({
      categories: { ...prefs.categories, [category]: !prefs.categories[category] },
    });
  };

  const handleDailyCapChange = (values: number[]) => {
    updatePrefs.mutate({ daily_cap: values[0] });
  };

  return (
    <div className="space-y-6">
      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>
            No non-critical notifications during these hours (P1 alerts still allowed)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Start: {quietStart}:00</Label>
            <Label>End: {quietEnd}:00</Label>
          </div>
          <Slider
            min={0}
            max={23}
            step={1}
            value={[quietStart, quietEnd]}
            onValueChange={handleQuietHoursChange}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Currently: {quietStart}:00 - {quietEnd}:00 (local time)
          </p>
        </CardContent>
      </Card>

      {/* Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notification Channels</CardTitle>
          </div>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <Label htmlFor="in_app">In-App</Label>
            </div>
            <Switch
              id="in_app"
              checked={prefs.channels.in_app}
              onCheckedChange={() => handleChannelToggle('in_app')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <Label htmlFor="email">Email</Label>
            </div>
            <Switch
              id="email"
              checked={prefs.channels.email}
              onCheckedChange={() => handleChannelToggle('email')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <Label htmlFor="push">Push</Label>
            </div>
            <Switch
              id="push"
              checked={prefs.channels.push}
              onCheckedChange={() => handleChannelToggle('push')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <Label htmlFor="sms">SMS</Label>
            </div>
            <Switch
              id="sms"
              checked={prefs.channels.sms}
              onCheckedChange={() => handleChannelToggle('sms')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
          <CardDescription>Control which types of notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(prefs.categories).map(([category, enabled]) => (
            <div key={category} className="flex items-center justify-between">
              <Label htmlFor={category} className="capitalize">
                {category.replace('_', ' ')}
              </Label>
              <Switch
                id={category}
                checked={enabled}
                onCheckedChange={() =>
                  handleCategoryToggle(category as keyof NotificationPrefs['categories'])
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Daily Cap */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Limit</CardTitle>
          <CardDescription>
            Maximum non-critical notifications per day (critical alerts always delivered)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Daily Cap: {prefs.daily_cap}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updatePrefs.mutate({ daily_cap: 10 })}
            >
              Reset to 10
            </Button>
          </div>
          <Slider
            min={1}
            max={50}
            step={1}
            value={[prefs.daily_cap]}
            onValueChange={handleDailyCapChange}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Digest */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Digest</CardTitle>
          <CardDescription>
            Receive a summary of missed notifications (if email enabled)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Send daily digest at:</Label>
            <select
              value={prefs.digest_hour}
              onChange={(e) => updatePrefs.mutate({ digest_hour: parseInt(e.target.value) })}
              className="px-3 py-2 bg-background border rounded-md"
            >
              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                <option key={hour} value={hour}>
                  {hour}:00
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            {prefs.channels.email
              ? `Daily summary will be sent at ${prefs.digest_hour}:00`
              : 'Enable email notifications to receive digests'}
          </p>
        </CardContent>
      </Card>

      {/* Test Notification */}
      <Card>
        <CardHeader>
          <CardTitle>Test Your Settings</CardTitle>
          <CardDescription>Send a test notification to verify your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={async () => {
              const { error } = await supabase.rpc('notif_send', {
                p_user_id: (await supabase.auth.getUser()).data.user?.id,
                p_category: 'system',
                p_priority: 3,
                p_title: 'Test Notification',
                p_body: 'This is a test notification to verify your settings',
              });
              if (error) {
                toast({ title: 'Test failed', description: String(error), variant: 'destructive' });
              } else {
                toast({ title: 'Test sent', description: 'Check your notification panel' });
              }
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            Send Test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
