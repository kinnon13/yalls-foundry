/**
 * Settings Module
 * Profile, Appearance, Notifications, AI Activity, Privacy/Data
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2 } from 'lucide-react';

export function Settings() {
  const { session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session?.userId)
        .maybeSingle();
      return data;
    },
    enabled: !!session?.userId,
  });

  const { data: aiConsent } = useQuery({
    queryKey: ['ai-consent', session?.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('ai_consent')
        .select('*')
        .eq('user_id', session?.userId)
        .maybeSingle();
      return data;
    },
    enabled: !!session?.userId,
  });

  const exportData = useMutation({
    mutationFn: async () => {
      await supabase.from('ai_action_ledger').insert({
        user_id: session?.userId,
        agent: 'user',
        action: 'data_export_requested',
        input: {},
        output: { status: 'queued' },
        result: 'success'
      });
    },
    onSuccess: () => {
      toast({ title: 'Export queued', description: 'You\'ll receive a download link soon' });
    },
  });

  const requestDeletion = useMutation({
    mutationFn: async () => {
      await supabase.from('ai_action_ledger').insert({
        user_id: session?.userId,
        agent: 'user',
        action: 'account_deletion_requested',
        input: {},
        output: { status: 'review' },
        result: 'success'
      });
    },
    onSuccess: () => {
      toast({ title: 'Deletion requested', description: 'Your request is under review' });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Account preferences & privacy</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai">AI Activity</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Display Name</Label>
                <Input defaultValue={profile?.display_name || ''} />
              </div>
              <div>
                <Label>Bio</Label>
                <Input defaultValue={profile?.bio || ''} placeholder="Tell us about yourself" />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive updates</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure lane prefs and digest times via notification_prefs
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Activity</CardTitle>
              <CardDescription>Recent Rocker actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Rocker is always ON. You can control when it contacts you below.
              </p>
              <div className="space-y-2 mb-4">
                <div>
                  <Label>Quiet Hours</Label>
                  <p className="text-sm text-muted-foreground">
                    Current: {(aiConsent?.quiet_hours as string) || 'None set'}
                  </p>
                </div>
                <div>
                  <Label>Frequency Cap</Label>
                  <p className="text-sm text-muted-foreground">
                    {aiConsent?.frequency_cap || 5} messages/day
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Export or delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Export My Data</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Download all your data in JSON format
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData.mutate()}
                  disabled={exportData.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Request Export
                </Button>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-destructive">
                  Delete Account
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Permanently delete your account and all data
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => requestDeletion.mutate()}
                  disabled={requestDeletion.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Request Deletion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
