/**
 * Step 2: Interests
 * Multi-select from interests_catalog
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

interface InterestsStepProps {
  onComplete: () => void;
  onBack: () => void;
}

interface Interest {
  id: string;
  category: string;
  tag: string;
}

export function InterestsStep({ onComplete, onBack }: InterestsStepProps) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInterests();
    loadExisting();
  }, []);

  const loadInterests = async () => {
    const { data } = await supabase
      .from('interests_catalog')
      .select('id, category, tag')
      .order('sort_order');

    if (data) setInterests(data);
  };

  const loadExisting = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('interests')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.interests) {
      setSelected(profile.interests as string[]);
    }
  };

  const toggleInterest = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ interests: selected })
        .eq('user_id', user.id);

      if (error) throw error;

      onComplete();
    } catch (err) {
      console.error('[InterestsStep] Save error:', err);
      alert('Failed to save interests');
    } finally {
      setLoading(false);
    }
  };

  // Group by category
  const grouped = interests.reduce((acc, interest) => {
    if (!acc[interest.category]) acc[interest.category] = [];
    acc[interest.category].push(interest);
    return acc;
  }, {} as Record<string, Interest[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What Are You Into?</h2>
        <p className="text-muted-foreground">
          Pick your interests so we can personalize your feed
        </p>
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {items.map((interest) => (
                <div key={interest.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest.id}
                    checked={selected.includes(interest.id)}
                    onCheckedChange={() => toggleInterest(interest.id)}
                  />
                  <Label
                    htmlFor={interest.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {interest.tag}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || selected.length === 0}
          className="flex-1"
        >
          {loading ? 'Saving...' : `Continue (${selected.length} selected)`}
        </Button>
      </div>

      {selected.length === 0 && (
        <p className="text-sm text-center text-muted-foreground">
          Select at least one interest to continue
        </p>
      )}
    </div>
  );
}
