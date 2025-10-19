/**
 * Step 1: Handle & Display Name
 * Unique @handle + profanity filter
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Loader2, ArrowLeft } from 'lucide-react';

interface HandleStepProps {
  onComplete: () => void;
  onBack: () => void;
}

// Simple profanity filter (expand as needed)
const PROFANITY_LIST = ['fuck', 'shit', 'damn', 'ass', 'bitch', 'bastard'];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some(word => lower.includes(word));
}

export function HandleStep({ onComplete, onBack }: HandleStepProps) {
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Load existing data
  useEffect(() => {
    loadExisting();
  }, []);

  const loadExisting = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('handle, display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile) {
      if (profile.handle) setHandle(profile.handle);
      if (profile.display_name) setDisplayName(profile.display_name);
    }
  };

  // Debounced handle check
  useEffect(() => {
    if (!handle || handle.length < 3) {
      setAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      await checkHandle(handle);
    }, 300);

    return () => clearTimeout(timer);
  }, [handle]);

  const checkHandle = async (h: string) => {
    setChecking(true);
    setErrors(prev => ({ ...prev, handle: '' }));

    try {
      // Format check
      if (!/^[a-z0-9_.]{3,20}$/.test(h)) {
        setAvailable(false);
        setErrors(prev => ({ ...prev, handle: '3-20 characters, lowercase, numbers, . or _' }));
        setChecking(false);
        return;
      }

      if (h.startsWith('.') || h.endsWith('.') || h.includes('__') || h.includes('..')) {
        setAvailable(false);
        setErrors(prev => ({ ...prev, handle: 'Cannot start/end with . or have __ or ..' }));
        setChecking(false);
        return;
      }

      // Profanity check
      if (containsProfanity(h)) {
        setAvailable(false);
        setErrors(prev => ({ ...prev, handle: 'Please choose a different handle' }));
        setChecking(false);
        return;
      }

      // Check availability
      const { data, error } = await supabase.rpc('check_handle_available', { p_handle: h });
      if (error) throw error;

      setAvailable(Boolean(data));
      if (!data) {
        setErrors(prev => ({ ...prev, handle: 'Handle already taken' }));
      }
    } catch (err) {
      console.error('[HandleStep] Check error:', err);
      setAvailable(null);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    // Validate
    const newErrors: Record<string, string> = {};

    if (!handle || handle.length < 3) {
      newErrors.handle = 'Handle is required (3-20 characters)';
    }
    if (!displayName || displayName.length < 2) {
      newErrors.displayName = 'Display name is required (at least 2 characters)';
    }
    if (containsProfanity(displayName)) {
      newErrors.displayName = 'Please choose a different name';
    }
    if (available !== true) {
      newErrors.handle = 'Handle is not available';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          handle: handle.toLowerCase(),
          display_name: displayName
        })
        .eq('user_id', user.id);

      if (error) throw error;

      onComplete();
    } catch (err) {
      console.error('[HandleStep] Save error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Your Handle</h2>
        <p className="text-muted-foreground">
          Your unique @username on Y'alls
        </p>
      </div>

      <div className="space-y-4">
        {/* Handle */}
        <div className="space-y-2">
          <Label htmlFor="handle">Handle</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              @
            </div>
            <Input
              id="handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="yourname"
              className="pl-7"
              maxLength={20}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {!checking && available === true && <Check className="h-4 w-4 text-green-600" />}
              {!checking && available === false && <X className="h-4 w-4 text-destructive" />}
            </div>
          </div>
          {errors.handle && <p className="text-sm text-destructive">{errors.handle}</p>}
          {available === true && <p className="text-sm text-green-600">✓ Available</p>}
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display-name">Display Name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
            maxLength={50}
          />
          {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || available !== true}
          className="flex-1"
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
