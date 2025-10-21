/**
 * Step 4: Business Quick Setup (AI-Assisted)
 * Conversational flow with optional voice + legacy form fallback
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { GhostMatchList } from './GhostMatchList';
import { MarketplaceCategoryCombobox } from './MarketplaceCategoryCombobox';
import { RockerBusinessChat } from './RockerBusinessChat';
import { BusinessChatOnboarding } from './BusinessChatOnboarding';
import { useToast } from '@/hooks/use-toast';

interface BusinessStepProps {
  onComplete: () => void;
  onBack: () => void;
}

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

export function BusinessStep({ onComplete, onBack }: BusinessStepProps) {
  // Feature flag for conversational onboarding (default: enabled)
  const useConversational = true; // Can be env var later
  
  if (useConversational) {
    return <BusinessChatOnboarding onComplete={onComplete} onSkip={onComplete} onBack={onBack} />;
  }
  
  // Legacy form UI (fallback)
  return <LegacyBusinessForm onComplete={onComplete} onBack={onBack} />;
}

// Legacy form component (kept for fallback/accessibility)
function LegacyBusinessForm({ onComplete, onBack }: BusinessStepProps) {
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

  const handleSkip = () => onComplete();

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
      toast({ title: 'Business name required', description: 'Please enter your business name to continue', variant: 'destructive' });
      return;
    }
    if (categories.length === 0) {
      toast({ title: 'Category required', description: 'Please select at least one category', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/business-quick-setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          website: website || null,
          phone: phone || null,
          city: city || null,
          state: state || null,
          bio: bio || null,
          categories: categories.map(c => ({ label: c.label, parent_key: null, synonyms: [] })),
          ai: false,
          claim_entity_id: claimEntityId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create business');
      }

      const result = await response.json();
      toast({
        title: claimEntityId ? 'Claim submitted' : 'Business created',
        description: claimEntityId ? 'Your claim has been submitted for review. You can manage it from your dashboard.' : `Your business profile is live at /b/${result.profile_slug}`,
      });
      onComplete();
    } catch (err) {
      console.error('[BusinessStep] Save error:', err);
      toast({ title: 'Failed to save', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8 py-6 h-full">
      <header className="mb-4 md:mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Business Quick Setup
        </h2>
        <p className="text-muted-foreground">Set up your business in under a minute. AI will help you along the way.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:grid-cols-12 items-start">
        {/* LEFT: form */}
        <section className="lg:col-span-5 min-w-0 lg:min-w-[420px]">
          <div className="rounded-xl border bg-card p-4 md:p-6 flex flex-col relative z-10">
            {/* Choice Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setWantBusiness(false)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${!wantBusiness ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}`}
              >
                <div className="font-medium text-base mb-1">I'm just a user</div>
                <div className="text-sm text-muted-foreground">Skip this step</div>
              </button>
              <button
                type="button"
                onClick={() => setWantBusiness(true)}
                className={`p-6 rounded-lg border-2 transition-all text-left ${wantBusiness ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}`}
              >
                <div className="font-medium text-base mb-1">I run a business</div>
                <div className="text-sm text-muted-foreground">Quick setup with AI</div>
              </button>
            </div>

            {wantBusiness && (
              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name *</Label>
                  <Input id="business-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sunset Stables, Tack & Trail Co." maxLength={100} disabled={!!claimEntityId} />
                  <GhostMatchList name={name} phone={phone} website={website} onClaim={handleClaim} claimedId={claimEntityId} />
                </div>

                <div className="space-y-2">
                  <Label>Marketplace Categories *</Label>
                  <MarketplaceCategoryCombobox value={categories} onChange={setCategories} suggestions={categorySuggestions} placeholder="Search or create categories..." />
                  <p className="text-xs text-muted-foreground">Select categories for your marketplace listings</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" type="url" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" type="tel" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="San Francisco" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="CA" maxLength={2} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Short Bio</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell people about your business..." rows={3} maxLength={500} />
                  <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={wantBusiness ? handleSubmit : handleSkip} disabled={loading || (wantBusiness && (!name.trim() || categories.length === 0))} className="flex-1">
                    {loading ? 'Saving...' : wantBusiness ? (claimEntityId ? 'Claim & Continue' : 'Save & Continue') : 'Skip'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: chat rail */}
        <aside className="lg:col-span-7 min-w-0">
          <div className="h-full min-h-[70vh] rounded-xl border bg-background overflow-hidden">
            <div className="max-h-[calc(100vh-220px)] overflow-auto px-4 py-3">
              <RockerBusinessChat businessName={name} website={website} onSuggestCategories={setCategorySuggestions} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
