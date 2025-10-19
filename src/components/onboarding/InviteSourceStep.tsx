import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InviteSourceStepProps {
  onComplete: () => void;
}

export function InviteSourceStep({ onComplete }: InviteSourceStepProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteKind, setInviteKind] = useState<'user' | 'entity' | 'other' | 'unknown'>('unknown');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteMedium, setInviteMedium] = useState('');
  const [freeText, setFreeText] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get session ID from storage
      const sessionId = sessionStorage.getItem('session_id') || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Read UTM params from URL if present
      const params = new URLSearchParams(window.location.search);
      const utm = {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
        term: params.get('utm_term') || undefined,
        content: params.get('utm_content') || undefined,
      };

      const { error } = await supabase.from('user_acquisition').upsert({
        user_id: user.id,
        invited_by_kind: inviteKind,
        invited_by_id: null, // TODO: Add entity/user search picker
        invite_code: inviteCode || null,
        invite_medium: inviteMedium || freeText || 'organic',
        utm,
        ref_session_id: sessionId,
        last_touch_ts: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: 'Invite source recorded',
        description: 'Thank you for sharing how you found us!'
      });

      onComplete();
    } catch (error) {
      console.error('[InviteSourceStep] Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save invite source',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h2 className="text-2xl font-bold mb-2">How did you hear about us?</h2>
        <p className="text-muted-foreground">
          This helps us understand our community and improve our service.
        </p>
      </div>

      <RadioGroup value={inviteKind} onValueChange={(v) => setInviteKind(v as typeof inviteKind)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="user" id="user" />
          <Label htmlFor="user">A friend or colleague invited me</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="entity" id="entity" />
          <Label htmlFor="entity">A business or organization invited me</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="other" id="other" />
          <Label htmlFor="other">Other (search engine, social media, etc.)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="unknown" id="unknown" />
          <Label htmlFor="unknown">I don't remember / prefer not to say</Label>
        </div>
      </RadioGroup>

      {(inviteKind === 'user' || inviteKind === 'entity') && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="invite-code">Invitation Code (optional)</Label>
            <Input
              id="invite-code"
              placeholder="e.g., FRIEND2025"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="invite-medium">How did they share it?</Label>
            <Input
              id="invite-medium"
              placeholder="e.g., email, text, in person"
              value={inviteMedium}
              onChange={(e) => setInviteMedium(e.target.value)}
            />
          </div>
        </div>
      )}

      {inviteKind === 'other' && (
        <div>
          <Label htmlFor="free-text">Please tell us more</Label>
          <Input
            id="free-text"
            placeholder="e.g., Google search, Instagram ad, blog post"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
          />
        </div>
      )}

      <Button 
        onClick={handleSubmit} 
        disabled={loading}
        className="w-full"
        data-testid="invite-submit"
      >
        {loading ? 'Saving...' : 'Continue'}
      </Button>
    </div>
  );
}
