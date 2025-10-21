/**
 * Step 4: Business Quick Setup (AI-Assisted)
 * Dynamic categories, ghost matching, Rocker integration
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { CategoryCombobox } from './CategoryCombobox';
import { GhostMatchList } from './GhostMatchList';
import { RockerChat } from '@/components/rocker/RockerChat';
import { useToast } from '@/hooks/use-toast';

interface BusinessStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function BusinessStep({ onComplete, onBack }: BusinessStepProps) {
  const [wantBusiness, setWantBusiness] = useState(false);
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [bio, setBio] = useState('');
  const [claimEntityId, setClaimEntityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSkip = () => {
    onComplete();
  };

  const handleClaim = (entityId: string, entityName: string) => {
    if (claimEntityId === entityId) {
      setClaimEntityId(null);
    } else {
      setClaimEntityId(entityId);
      setName(entityName);
    }
  };

  const handleSubmit = async () => {
    if (!wantBusiness) {
      onComplete();
      return;
    }

    if (!name.trim()) {
      toast({
        title: 'Business name required',
        description: 'Please enter your business name to continue',
        variant: 'destructive'
      });
      return;
    }

    if (categories.length === 0) {
      toast({
        title: 'Category required',
        description: 'Please select at least one category',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (claimEntityId) {
        // Claim existing ghost entity
        const { error } = await supabase.rpc('claim_ghost_entity', {
          p_entity: claimEntityId,
          p_user: user.id
        });

        if (error) throw error;

        toast({
          title: 'Claim submitted',
          description: 'Your claim has been submitted for review. You can manage it from your dashboard.',
        });
      } else {
        // Create new business
        const { data: entityId, error } = await supabase.rpc('create_business_quick', {
          p_owner_user: user.id,
          p_name: name.trim(),
          p_categories: categories,
          p_website: website || null,
          p_phone: phone || null,
          p_city: city || null,
          p_state: state || null,
          p_bio: bio || null
        });

        if (error) throw error;

        toast({
          title: 'Business created',
          description: 'Your business profile is live. Manage it from your dashboard.',
        });
      }

      onComplete();
    } catch (err) {
      console.error('[BusinessStep] Save error:', err);
      toast({
        title: 'Failed to save',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6 h-full">
      {/* Main Form */}
      <div className="space-y-6 overflow-y-auto">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Business Quick Setup
          </h2>
          <p className="text-muted-foreground">
            Set up your business in under a minute. AI will help you along the way.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setWantBusiness(false)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                !wantBusiness
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="font-medium">I'm just a user</div>
              <div className="text-xs text-muted-foreground mt-1">Skip this step</div>
            </button>
            <button
              type="button"
              onClick={() => setWantBusiness(true)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                wantBusiness
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="font-medium">I run a business</div>
              <div className="text-xs text-muted-foreground mt-1">Quick setup with AI</div>
            </button>
          </div>

          {wantBusiness && (
            <>
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name *</Label>
                <Input
                  id="business-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sunset Stables, Tack & Trail Co."
                  maxLength={100}
                  disabled={!!claimEntityId}
                />
                
                <GhostMatchList
                  name={name}
                  phone={phone}
                  website={website}
                  onClaim={handleClaim}
                  claimedId={claimEntityId}
                />
              </div>

              <div className="space-y-2">
                <Label>Categories *</Label>
                <CategoryCombobox
                  value={categories}
                  onChange={setCategories}
                  placeholder="Search or create categories..."
                />
                <p className="text-xs text-muted-foreground">
                  Select categories that describe your business
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    type="tel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Short Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people about your business..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={wantBusiness ? handleSubmit : handleSkip}
            disabled={loading || (wantBusiness && (!name.trim() || categories.length === 0))}
            className="flex-1"
          >
            {loading ? 'Saving...' : wantBusiness ? (claimEntityId ? 'Claim & Continue' : 'Save & Continue') : 'Skip'}
          </Button>
        </div>
      </div>

      {/* AI Sidekick */}
      {wantBusiness && (
        <div className="hidden lg:block border-l pl-6">
          <div className="sticky top-0">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Assistant
            </h3>
            <div className="h-[600px]">
              <RockerChat actorRole="admin" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
