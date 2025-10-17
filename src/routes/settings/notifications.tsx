/**
 * Notification Settings Page
 * Full preferences UI with channels, categories, quiet hours, digest
 */

import React, { useState } from 'react';
import { useNotificationPrefs } from '@/hooks/useNotificationPrefs';
import { useSession } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DigestPreview } from '@/components/notifications/DigestPreview';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Mail, Smartphone, MessageSquare } from 'lucide-react';

export default function NotificationSettings() {
  const { session } = useSession();
  const userId = session?.userId || '';
  const { prefs, isLoading, update, digestPreview, sendTestDigest } = useNotificationPrefs(userId);
  const [showDigestPreview, setShowDigestPreview] = useState(false);

  if (isLoading || !prefs) {
    return (
      <div className="container max-w-3xl py-8">
        <div className="text-center">Loading preferences...</div>
      </div>
    );
  }

  const handleChannelToggle = (channel: keyof typeof prefs.channels) => {
    update.mutate({
      channels: { ...prefs.channels, [channel]: !prefs.channels[channel] },
    });
  };

  const handleCategoryToggle = (
    lane: 'priority' | 'social' | 'system',
    channel: keyof typeof prefs.channels
  ) => {
    update.mutate({
      categories: {
        ...prefs.categories,
        [lane]: {
          ...prefs.categories[lane],
          [channel]: !prefs.categories[lane][channel],
        },
      },
    });
  };

  const handleQuietHours = (field: 'start' | 'end', value: string) => {
    update.mutate({
      quiet_hours: {
        ...prefs.quiet_hours,
        [field]: value,
      } as any,
    });
  };

  const handleDailyCapChange = (value: number[]) => {
    update.mutate({ daily_cap: value[0] });
  };

  const handleDigestFrequency = (value: 'off' | 'daily' | 'weekly') => {
    update.mutate({ digest_frequency: value });
  };

  const handlePreviewDigest = async () => {
    await digestPreview.refetch();
    setShowDigestPreview(true);
  };

  return (
    <div className="container max-w-3xl py-8 space-y-8" role="region" aria-label="Notification settings">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Last saved {formatDistanceToNow(new Date(prefs.updated_at), { addSuffix: true })}
        </p>
      </div>

      {/* Global Channels */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Channels</h2>
          <p className="text-sm text-muted-foreground">
            Enable or disable notification delivery methods
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="channel-in-app" className="font-medium">In-app</Label>
                <p className="text-xs text-muted-foreground">Show notifications in the app</p>
              </div>
            </div>
            <Switch
              id="channel-in-app"
              checked={prefs.channels.in_app}
              onCheckedChange={() => handleChannelToggle('in_app')}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="channel-email" className="font-medium">Email</Label>
                <p className="text-xs text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="channel-email"
              checked={prefs.channels.email}
              onCheckedChange={() => handleChannelToggle('email')}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="channel-push" className="font-medium">Push</Label>
                <p className="text-xs text-muted-foreground">Mobile push notifications</p>
              </div>
            </div>
            <Switch
              id="channel-push"
              checked={prefs.channels.push}
              onCheckedChange={() => handleChannelToggle('push')}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="channel-sms" className="font-medium">SMS</Label>
                <p className="text-xs text-muted-foreground">Text message notifications</p>
              </div>
            </div>
            <Switch
              id="channel-sms"
              checked={prefs.channels.sms}
              onCheckedChange={() => handleChannelToggle('sms')}
            />
          </div>
        </div>
      </section>

      {/* Categories per Lane */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Customize channels for each notification type
          </p>
        </div>

        <Tabs defaultValue="priority" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="priority">Priority</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {(['priority', 'social', 'system'] as const).map((lane) => (
            <TabsContent key={lane} value={lane} className="space-y-2 mt-4">
              {Object.keys(prefs.channels).map((ch) => {
                const channel = ch as keyof typeof prefs.channels;
                return (
                  <div key={channel} className="flex items-center justify-between p-3 rounded border">
                    <Label htmlFor={`${lane}-${channel}`} className="capitalize">{channel.replace('_', '-')}</Label>
                    <Switch
                      id={`${lane}-${channel}`}
                      checked={prefs.categories[lane][channel]}
                      onCheckedChange={() => handleCategoryToggle(lane, channel)}
                    />
                  </div>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Quiet Hours */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Quiet Hours</h2>
          <p className="text-sm text-muted-foreground">
            No notifications during these times (local time)
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quiet-start">Start</Label>
            <input
              id="quiet-start"
              type="time"
              value={prefs.quiet_hours?.start || '22:00'}
              onChange={(e) => handleQuietHours('start', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border"
            />
          </div>
          <div>
            <Label htmlFor="quiet-end">End</Label>
            <input
              id="quiet-end"
              type="time"
              value={prefs.quiet_hours?.end || '08:00'}
              onChange={(e) => handleQuietHours('end', e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded border"
            />
          </div>
        </div>
      </section>

      {/* Daily Cap */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Daily Limit</h2>
          <p className="text-sm text-muted-foreground">
            Maximum notifications per day: <strong>{prefs.daily_cap}</strong>
          </p>
        </div>

        <Slider
          value={[prefs.daily_cap]}
          onValueChange={handleDailyCapChange}
          min={10}
          max={100}
          step={5}
          className="w-full"
        />
      </section>

      {/* Digest */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Digest</h2>
          <p className="text-sm text-muted-foreground">
            Receive a summary of notifications
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Label htmlFor="digest-frequency">Frequency</Label>
          <Select value={prefs.digest_frequency} onValueChange={handleDigestFrequency}>
            <SelectTrigger id="digest-frequency" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>

          {prefs.digest_frequency !== 'off' && (
            <Button variant="outline" size="sm" onClick={handlePreviewDigest}>
              Preview
            </Button>
          )}
        </div>

        {showDigestPreview && digestPreview.data && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/30">
            <DigestPreview
              groups={digestPreview.data}
              onSendTest={() => sendTestDigest.mutate()}
              isLoading={sendTestDigest.isPending}
            />
          </div>
        )}
      </section>
    </div>
  );
}
