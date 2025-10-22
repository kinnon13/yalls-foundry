import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export function AndyPreferences() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('ai_user_profiles' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setProfile(data || {
        tone: 'friendly concise',
        verbosity: 'medium',
        format_pref: 'bullets',
        visual_pref: false,
        approval_mode: 'ask',
        suggestion_freq: 'daily',
        private_mode_default: false,
        taboo_topics: [],
        notes: ''
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_user_profiles' as any)
        .upsert({
          user_id: user.id,
          ...profile,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Your preferences have been updated",
      });

      // Record signal
      await supabase.from('ai_learnings' as any).insert({
        user_id: user.id,
        rating: 5,
        tags: ['updated_preferences'],
        created_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Andy Preferences</h2>
        <p className="text-muted-foreground">Customize how Andy communicates with you</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label>Tone</Label>
          <Input
            value={profile?.tone || ''}
            onChange={(e) => setProfile({ ...profile, tone: e.target.value })}
            placeholder="e.g., friendly concise, formal, casual"
          />
          <p className="text-sm text-muted-foreground">How Andy should sound</p>
        </div>

        <div className="space-y-2">
          <Label>Verbosity</Label>
          <Select
            value={profile?.verbosity || 'medium'}
            onValueChange={(v) => setProfile({ ...profile, verbosity: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (brief, to-the-point)</SelectItem>
              <SelectItem value="medium">Medium (balanced)</SelectItem>
              <SelectItem value="high">High (detailed, thorough)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Format Preference</Label>
          <Select
            value={profile?.format_pref || 'bullets'}
            onValueChange={(v) => setProfile({ ...profile, format_pref: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bullets">Bullets (lists & key points)</SelectItem>
              <SelectItem value="prose">Prose (paragraphs)</SelectItem>
              <SelectItem value="mixed">Mixed (Andy chooses)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Visual Learner</Label>
            <p className="text-sm text-muted-foreground">Show charts/diagrams with data</p>
          </div>
          <Switch
            checked={profile?.visual_pref || false}
            onCheckedChange={(checked) => setProfile({ ...profile, visual_pref: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Approval Mode</Label>
          <Select
            value={profile?.approval_mode || 'ask'}
            onValueChange={(v) => setProfile({ ...profile, approval_mode: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ask">Ask Before Acting</SelectItem>
              <SelectItem value="auto">Auto-Execute When Appropriate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Suggestion Frequency</Label>
          <Select
            value={profile?.suggestion_freq || 'daily'}
            onValueChange={(v) => setProfile({ ...profile, suggestion_freq: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="off">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Private Mode by Default</Label>
            <p className="text-sm text-muted-foreground">No external calls, local only</p>
          </div>
          <Switch
            checked={profile?.private_mode_default || false}
            onCheckedChange={(checked) => setProfile({ ...profile, private_mode_default: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Topics to Avoid (comma-separated)</Label>
          <Input
            value={profile?.taboo_topics?.join(', ') || ''}
            onChange={(e) => setProfile({ 
              ...profile, 
              taboo_topics: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
            })}
            placeholder="e.g., politics, sports"
          />
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={profile?.notes || ''}
            onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
            placeholder="Any additional preferences or context for Andy..."
            rows={3}
          />
        </div>

        <Button onClick={saveProfile} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </Card>
    </div>
  );
}
