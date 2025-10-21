/**
 * Step 4: Business Quick Setup (AI-Assisted)
 * Dynamic categories, ghost matching, Rocker integration
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { GhostMatchList } from './GhostMatchList';
import { MarketplaceCategoryCombobox } from './MarketplaceCategoryCombobox';
import { RockerBusinessChat } from './RockerBusinessChat';
import { useToast } from '@/hooks/use-toast';

interface MarketplaceCategory {
  key: string;
  label: string;
  status: 'active' | 'pending' | 'deprecated';
}

interface CategorySuggestion {
  label: string;
  parent_key: string | null;
  synonyms: string[];
}

interface BusinessStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function BusinessStep({ onComplete, onBack }: BusinessStepProps) {
  const [wantBusiness, setWantBusiness] = useState(false);
  const [name, setName] = useState('');
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [categorySuggestions, setCategorySuggestions] = useState<CategorySuggestion[]>([]);
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
        const { error } = await supabase.rpc('claim_ghost_entity' as any, {
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
        const { data: entityId, error } = await supabase.rpc('create_business_quick' as any, {
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] h-full">
      {/* Main Content */}
      <div className="flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Business Quick Setup
            </h2>
            <p className="text-muted-foreground">
              Set up your business in under a minute. AI will help you along the way.
            </p>
          </div>

          <div className="space-y-6">
            {/* Choice Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setWantBusiness(false)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  !wantBusiness
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="font-medium text-base mb-1">I'm just a user</div>
                <div className="text-sm text-muted-foreground">Skip this step</div>
              </button>
              <button
                type="button"
                onClick={() => setWantBusiness(true)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  wantBusiness
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="font-medium text-base mb-1">I run a business</div>
                <div className="text-sm text-muted-foreground">Quick setup with AI</div>
              </button>
            </div>

            {/* Business Form */}
            {wantBusiness && (
              <div className="space-y-4">
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
                  <Label>Marketplace Categories *</Label>
                  <MarketplaceCategoryCombobox
                    value={categories}
                    onChange={setCategories}
                    suggestions={categorySuggestions}
                    placeholder="Search or create categories..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Select categories for your marketplace listings
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
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Fixed Bottom Actions */}
        <div className="border-t bg-background p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
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
      </div>

      {/* iPhone-style AI Chat */}
      {wantBusiness && (
        <RockerBusinessChat 
          businessName={name}
          website={website}
          onSuggestCategories={setCategorySuggestions}
        />
      )}
    </div>
  );
}
