/**
 * Campaigns Tab - DemandGen email/SMS/chat campaigns
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Calendar, Users } from 'lucide-react';
import { toast } from 'sonner';

type Campaign = {
  id: string;
  name: string;
  channel: 'sms' | 'email' | 'chat';
  template: {
    subject?: string;
    body: string;
  };
  schedule_at: string | null;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  sent_count: number;
  created_at: string;
};

const TEMPLATES = [
  {
    name: 'Flash Sale',
    subject: '⚡ Flash Sale - {{discount}}% Off',
    body: 'Hi {{first_name}},\n\nJust for you: {{discount}}% off {{listing_title}} for the next 24 hours!\n\nShop now: {{link}}',
  },
  {
    name: 'New Listing',
    subject: '🆕 New Arrival: {{listing_title}}',
    body: 'Hey {{first_name}},\n\nCheck out our newest listing: {{listing_title}}\n\nView details: {{link}}',
  },
  {
    name: 'Event Reminder',
    subject: '📅 Reminder: {{event_title}}',
    body: 'Hi {{first_name}},\n\n{{event_title}} is coming up on {{event_date}}!\n\nDetails: {{link}}',
  },
];

export function CampaignsTab() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns', session?.userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rocker_campaigns')
        .select('*')
        .eq('user_id', session!.userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data?.map(c => ({
        ...c,
        template: typeof c.template === 'object' ? c.template as any : { body: '' }
      })) as Campaign[];
    },
    enabled: !!session?.userId,
  });

  const createCampaign = useMutation({
    mutationFn: async (campaign: any) => {
      const { data, error } = await supabase
        .from('rocker_campaigns')
        .insert([{
          name: campaign.name || 'Untitled',
          channel: campaign.channel || 'email',
          template: campaign.template || {},
          schedule_at: campaign.schedule_at,
          status: campaign.status || 'draft',
          user_id: session!.userId,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created');
      setShowForm(false);
    },
  });

  const queueCampaign = useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await (supabase as any).rpc('schedule_campaign_sends', {
        p_campaign_id: campaignId,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(`Campaign scheduled - ${count} messages queued`);
    },
  });

  const scheduled = campaigns?.filter(c => c.status === 'scheduled') || [];
  const sent = campaigns?.filter(c => c.status === 'sent') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campaigns</h2>
          <p className="text-sm text-muted-foreground">Email, SMS, and in-app messaging</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {showForm && (
        <CampaignForm
          onSubmit={(data) => createCampaign.mutate(data)}
          templates={TEMPLATES}
        />
      )}

      {/* Scheduled */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Scheduled ({scheduled.length})
        </h3>
        <div className="space-y-4">
          {scheduled.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onQueue={() => queueCampaign.mutate(campaign.id)}
            />
          ))}
          {scheduled.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No scheduled campaigns
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sent */}
      {sent.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Send className="w-5 h-5 text-green-500" />
            Sent ({sent.length})
          </h3>
          <div className="space-y-4">
            {sent.slice(0, 5).map(campaign => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignForm({ onSubmit, templates }: { onSubmit: (data: Partial<Campaign>) => void; templates: typeof TEMPLATES }) {
  const [formData, setFormData] = useState({
    name: '',
    channel: 'email' as 'sms' | 'email' | 'chat',
    template: { subject: '', body: '' },
    schedule_at: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'scheduled' as const,
  });

  const applyTemplate = (template: typeof TEMPLATES[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      template: { subject: template.subject, body: template.body },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Campaign</CardTitle>
        <CardDescription>Send targeted messages to your audience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Template</Label>
          <div className="flex gap-2">
            {templates.map(t => (
              <Button
                key={t.name}
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(t)}
              >
                {t.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Holiday Sale 2024"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel">Channel</Label>
            <Select value={formData.channel} onValueChange={(v: any) => setFormData({ ...formData, channel: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="chat">In-App Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Subject {formData.channel === 'sms' && '(optional)'}</Label>
          <Input
            id="subject"
            value={formData.template.subject}
            onChange={(e) => setFormData({
              ...formData,
              template: { ...formData.template, subject: e.target.value }
            })}
            placeholder="Your subject line"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={formData.template.body}
            onChange={(e) => setFormData({
              ...formData,
              template: { ...formData.template, body: e.target.value }
            })}
            rows={5}
            placeholder="Hi {{first_name}}, ..."
          />
          <p className="text-xs text-muted-foreground">
            Variables: {'{{first_name}}, {{listing_title}}, {{discount}}, {{link}}'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="schedule">Schedule For</Label>
          <Input
            id="schedule"
            type="datetime-local"
            value={formData.schedule_at}
            onChange={(e) => setFormData({ ...formData, schedule_at: e.target.value })}
          />
        </div>

        <Button onClick={() => onSubmit(formData)} className="w-full">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Campaign
        </Button>
      </CardContent>
    </Card>
  );
}

function CampaignCard({ campaign, onQueue }: { campaign: Campaign; onQueue?: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{campaign.name}</CardTitle>
            <CardDescription className="capitalize">{campaign.channel}</CardDescription>
          </div>
          <Badge variant={campaign.status === 'sent' ? 'default' : 'outline'}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {campaign.template.subject && (
            <div>
              <span className="font-medium">Subject:</span> {campaign.template.subject}
            </div>
          )}
          <div className="text-muted-foreground">
            {campaign.template.body.slice(0, 100)}...
          </div>
          {campaign.status === 'sent' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <Users className="w-4 h-4" />
              {campaign.sent_count} recipients
            </div>
          )}
          {campaign.status === 'scheduled' && onQueue && (
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={onQueue}>
              <Send className="w-4 h-4 mr-2" />
              Send Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
