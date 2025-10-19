/**
 * Step 4: Business Setup (Optional)
 * Create seller/barn/trainer/shop profile
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Store, Warehouse, Award, ShoppingBag } from 'lucide-react';

interface BusinessStepProps {
  onComplete: () => void;
  onBack: () => void;
}

const BUSINESS_KINDS = [
  { value: 'seller', label: 'Seller', icon: Store, desc: 'Sell horses, tack, or services' },
  { value: 'barn', label: 'Barn', icon: Warehouse, desc: 'Boarding, training, or events' },
  { value: 'trainer', label: 'Trainer', icon: Award, desc: 'Professional instruction' },
  { value: 'shop', label: 'Shop', icon: ShoppingBag, desc: 'Tack shop or feed store' }
];

export function BusinessStep({ onComplete, onBack }: BusinessStepProps) {
  const [wantBusiness, setWantBusiness] = useState(false);
  const [kind, setKind] = useState<string>('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExisting();
  }, []);

  const loadExisting = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: business } = await supabase
      .from('business_profiles')
      .select('kind, name')
      .eq('owner_user_id', user.id)
      .maybeSingle();

    if (business) {
      setWantBusiness(true);
      setKind(business.kind);
      setName(business.name);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleSubmit = async () => {
    if (!wantBusiness) {
      onComplete();
      return;
    }

    if (!kind || !name) {
      alert('Please select a business type and enter a name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('upsert_business_profile', {
        p_kind: kind,
        p_name: name,
        p_meta: {}
      });

      if (error) throw error;

      onComplete();
    } catch (err) {
      console.error('[BusinessStep] Save error:', err);
      alert(err instanceof Error ? err.message : 'Failed to save business profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Business Profile</h2>
        <p className="text-muted-foreground">
          Optional: Set up a business profile if you sell or provide services
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
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
            onClick={() => setWantBusiness(true)}
            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
              wantBusiness
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-border/80'
            }`}
          >
            <div className="font-medium">I run a business</div>
            <div className="text-xs text-muted-foreground mt-1">Set up business profile</div>
          </button>
        </div>

        {wantBusiness && (
          <>
            <div className="space-y-3">
              <Label>Business Type</Label>
              <RadioGroup value={kind} onValueChange={setKind}>
                {BUSINESS_KINDS.map((biz) => {
                  const Icon = biz.icon;
                  return (
                    <div
                      key={biz.value}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        kind === biz.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-border/80'
                      }`}
                      onClick={() => setKind(biz.value)}
                    >
                      <RadioGroupItem value={biz.value} id={biz.value} />
                      <Icon className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <Label htmlFor={biz.value} className="font-medium cursor-pointer">
                          {biz.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{biz.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Sunset Stables, Tack & Trail Co."
                maxLength={100}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={wantBusiness ? handleSubmit : handleSkip}
          disabled={loading || (wantBusiness && (!kind || !name))}
          className="flex-1"
        >
          {loading ? 'Saving...' : wantBusiness ? 'Save & Continue' : 'Skip'}
        </Button>
      </div>
    </div>
  );
}
