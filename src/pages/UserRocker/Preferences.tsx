/**
 * User Rocker - Preferences
 * Edit AI personalization settings
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type Preferences = {
  tone: string;
  verbosity: string;
  format_pref: string;
  approval_mode: string;
  suggestion_freq: string;
  pathway_mode: string;
  visual_pref: string;
};

export default function Preferences() {
  const { session } = useSession();
  const [form, setForm] = useState<Preferences>({
    tone: 'friendly concise',
    verbosity: 'medium',
    format_pref: 'bullets',
    approval_mode: 'ask',
    suggestion_freq: 'daily',
    pathway_mode: 'auto',
    visual_pref: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      if (!session?.userId) return;

      const { data } = await supabase
        .from('ai_user_profiles' as any)
        .select('*')
        .eq('user_id', session.userId)
        .maybeSingle();

      if (data) {
        const profile = data as any;
        setForm({
          tone: profile.tone || 'friendly concise',
          verbosity: profile.verbosity || 'medium',
          format_pref: profile.format_pref || 'bullets',
          approval_mode: profile.approval_mode || 'ask',
          suggestion_freq: profile.suggestion_freq || 'daily',
          pathway_mode: profile.pathway_mode || 'auto',
          visual_pref: profile.visual_pref || '',
        });
      }
      setLoading(false);
    }

    loadPreferences();
  }, [session]);

  async function save() {
    if (!session?.userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('ai_user_profiles' as any)
        .upsert({
          user_id: session.userId,
          ...form,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading preferences...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Preferences</h1>
      <p className="text-muted-foreground mb-8">
        Customize how Super Andy responds to you.
      </p>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Input
              id="tone"
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              placeholder="e.g., friendly concise, professional, casual"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verbosity">Verbosity</Label>
            <Select value={form.verbosity} onValueChange={(v) => setForm({ ...form, verbosity: v })}>
              <SelectTrigger id="verbosity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terse">Terse</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="verbose">Verbose</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format Preference</Label>
            <Select value={form.format_pref} onValueChange={(v) => setForm({ ...form, format_pref: v })}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullets">Bullets</SelectItem>
                <SelectItem value="paragraphs">Paragraphs</SelectItem>
                <SelectItem value="tables">Tables</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approval">Approval Mode</Label>
            <Select value={form.approval_mode} onValueChange={(v) => setForm({ ...form, approval_mode: v })}>
              <SelectTrigger id="approval">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ask">Ask before executing</SelectItem>
                <SelectItem value="auto">Auto-execute</SelectItem>
                <SelectItem value="never">Never execute</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Suggestion Frequency</Label>
            <Select value={form.suggestion_freq} onValueChange={(v) => setForm({ ...form, suggestion_freq: v })}>
              <SelectTrigger id="frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pathway">Action Pathways</Label>
            <Select value={form.pathway_mode} onValueChange={(v) => setForm({ ...form, pathway_mode: v })}>
              <SelectTrigger id="pathway">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (org default)</SelectItem>
                <SelectItem value="heavy">Heavy (structured)</SelectItem>
                <SelectItem value="light">Light (free-form)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Heavy: Crisp 5-7 step plans. Light: Free-form responses.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visual">Visual Preference</Label>
            <Input
              id="visual"
              value={form.visual_pref}
              onChange={(e) => setForm({ ...form, visual_pref: e.target.value })}
              placeholder="Optional: visual style preferences"
            />
            <p className="text-xs text-muted-foreground">
              Describe any visual formatting you prefer (e.g., diagrams, emojis, color coding)
            </p>
          </div>

          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
