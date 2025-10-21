/**
 * Step 0: Invite/Acquisition Source
 * Required first step - captures attribution
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { emitEvent } from '@/lib/telemetry/events';
import { z } from 'zod';

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
  const [referralUsername, setReferralUsername] = useState('');
  const [validatingUsername, setValidatingUsername] = useState(false);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadExisting();
  }, []);

  const loadExisting = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: acq } = await supabase
      .from('user_acquisition')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (acq) {
      if (acq.invited_by_kind) setInviteKind(acq.invited_by_kind as any);
      if (acq.invite_code) setInviteCode(acq.invite_code);
      if (acq.invite_medium) setInviteMedium(acq.invite_medium);
    }

    // Load existing referrer if set
    const { data: profile } = await supabase
      .from('profiles')
      .select('invited_by, handle')
      .eq('user_id', user.id)
      .single();

    if (profile?.invited_by) {
      setReferrerId(profile.invited_by);
      // Fetch referrer's username
      const { data: referrer } = await supabase
        .from('profiles')
        .select('handle')
        .eq('user_id', profile.invited_by)
        .single();
      if (referrer?.handle) {
        setReferralUsername(referrer.handle);
      }
    }
  };

  // Input validation schema
  const handleSchema = z.string()
    .trim()
    .min(1, 'Username cannot be empty')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

  const parseHandle = (value: string): string | null => {
    if (!value) return null;
    const trimmed = value.trim();
    // Extract from full referral link ?ref=handle
    const refMatch = trimmed.match(/[?&]ref=([^&#]+)/i);
    if (refMatch) return refMatch[1].replace(/^@/, '').trim();
    // Strip leading @ if present
    return trimmed.replace(/^@/, '').trim() || null;
  };

  const validateUsername = useCallback(async (username: string) => {
    const handle = parseHandle(username);
    
    if (!handle) {
      setReferrerId(null);
      setUsernameError(null);
      return;
    }

    // Client-side validation with zod
    const validation = handleSchema.safeParse(handle);
    if (!validation.success) {
      setUsernameError(validation.error.errors[0].message);
      setReferrerId(null);
      setValidatingUsername(false);
      return;
    }

    setValidatingUsername(true);
    setUsernameError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id, handle')
        .eq('handle', handle)
        .maybeSingle();

      if (!profile) {
        setUsernameError(`No user with handle @${handle} exists`);
        setReferrerId(null);
        return;
      }

      if (profile.user_id === user.id) {
        setUsernameError('Cannot refer yourself');
        setReferrerId(null);
        return;
      }

      setReferrerId(profile.user_id);
      setUsernameError(null);
      toast({
        title: '✓ Valid username',
        description: `Referrer: @${profile.handle}`
      });
    } catch (err) {
      console.error('Username validation error:', err);
      setUsernameError('Error validating username');
      setReferrerId(null);
    } finally {
      setValidatingUsername(false);
    }
  }, [toast]);

  // Debounced validation
  const debouncedValidate = useCallback((username: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      validateUsername(username);
    }, 500); // 500ms debounce
  }, [validateUsername]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (inviteKind === 'other' && !freeText) {
      toast({ title: 'Please tell us how you found us', variant: 'destructive' });
      return;
    }

    if (inviteKind === 'user' && referralUsername && !referrerId) {
      toast({ 
        title: 'Invalid username', 
        description: 'Please enter a valid username or clear the field',
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get session ID
      const sessionId = sessionStorage.getItem('session_id') || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Read UTM params
      const params = new URLSearchParams(window.location.search);
      const utm = {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
      };

      const payload = {
        invited_by_kind: inviteKind,
        invited_by_id: referrerId || null,
        invite_code: inviteCode || null,
        invite_medium: inviteMedium || freeText || 'organic',
        utm,
        ref_session_id: sessionId
      };

      const { error } = await supabase.rpc('set_user_acquisition', { p_payload: payload });

      if (error) throw error;

      // Update profile with referrer to create tier hierarchy
      if (referrerId) {
        const normalized = parseHandle(referralUsername) || referralUsername.trim();
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            invited_by: referrerId,
            invite_source: normalized ? `@${normalized}` : null
          })
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Failed to update profile with referrer:', profileError);
        }
      }

      emitEvent('acquisition_capture', { 
        kind: inviteKind, 
        medium: payload.invite_medium,
        has_referrer: !!referrerId 
      });
      
      toast({
        title: '✓ Thanks for sharing!',
        description: referrerId 
          ? `You've been connected to @${parseHandle(referralUsername) || referralUsername.trim()}'s network`
          : 'Let\'s complete your profile'
      });

      onComplete();
    } catch (error) {
      console.error('[InviteSourceStep] Error:', error);
      
      const message = error instanceof Error ? error.message : 'Failed to save';
      
      // Handle self-referral error
      if (message.includes('self_referral_forbidden')) {
        toast({
          title: 'Cannot refer yourself',
          description: 'Please select a different person or choose "Other"',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive'
        });
      }
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

      {inviteKind === 'user' && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="referral-username">Referrer Username *</Label>
            <Input
              id="referral-username"
              placeholder="Enter their @username or paste referral link"
              value={referralUsername}
              onChange={(e) => {
                const value = e.target.value;
                setReferralUsername(value);
                setUsernameError(null);
                
                // Trigger debounced validation
                if (value.trim()) {
                  debouncedValidate(value);
                } else {
                  setReferrerId(null);
                  setUsernameError(null);
                  if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                  }
                }
              }}
              disabled={validatingUsername}
              className={usernameError ? 'border-destructive' : ''}
            />
            {validatingUsername && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="inline-block animate-pulse">●</span> Validating username...
              </p>
            )}
            {!validatingUsername && referrerId && (
              <p className="text-sm text-green-600 mt-1">✓ Valid referrer found</p>
            )}
            {!validatingUsername && usernameError && (
              <p className="text-sm text-destructive mt-1">{usernameError}</p>
            )}
          </div>
          <div>
            <Label htmlFor="invite-code">Invitation Code (optional)</Label>
            <Input
              id="invite-code"
              placeholder="e.g., FRIEND2025"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
            />
          </div>
        </div>
      )}

      {inviteKind === 'entity' && (
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
        disabled={loading || validatingUsername || (inviteKind === 'user' && referralUsername && (!referrerId || !!usernameError))}
        className="w-full"
        data-testid="invite-submit"
      >
        {loading ? 'Saving...' : validatingUsername ? 'Validating...' : 'Continue'}
      </Button>
    </div>
  );
}
