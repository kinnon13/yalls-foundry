/**
 * Universal Interests Step - Multi-vertical taxonomy
 * Replaces horse-only interests with broad categories
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface InterestsStepUniversalProps {
  onComplete: () => void;
  onBack: () => void;
}

interface Interest {
  id: string;
  domain: string;
  category: string;
  tag: string;
}

interface GroupedInterests {
  [domain: string]: {
    [category: string]: Interest[];
  };
}

export function InterestsStepUniversal({ onComplete, onBack }: InterestsStepUniversalProps) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [selected, setSelected] = useState<Map<string, { interest: Interest; affinity: number }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInterests();
    loadExisting();
  }, []);

  const loadInterests = async () => {
    const { data, error } = await supabase
      .from('interest_catalog')
      .select('id, domain, category, tag')
      .eq('is_active', true)
      .eq('locale', 'en-US')
      .order('domain')
      .order('category')
      .order('sort_order');

    if (error) {
      console.error('[InterestsStep] Load error:', error);
      toast({
        title: 'Error loading interests',
        description: 'Please refresh the page',
        variant: 'destructive'
      });
      return;
    }

    if (data) setInterests(data);
  };

  const loadExisting = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('user_interests')
      .select('interest_id, affinity, interest_catalog(id, domain, category, tag)')
      .eq('user_id', user.id);

    if (existing) {
      const map = new Map();
      existing.forEach((item: any) => {
        if (item.interest_catalog) {
          map.set(item.interest_id, {
            interest: item.interest_catalog,
            affinity: item.affinity || 0.8
          });
        }
      });
      setSelected(map);
    }
  };

  const toggleInterest = (interest: Interest) => {
    setSelected(prev => {
      const newMap = new Map(prev);
      if (newMap.has(interest.id)) {
        newMap.delete(interest.id);
      } else {
        newMap.set(interest.id, { interest, affinity: 0.8 });
      }
      return newMap;
    });
  };

  const handleSubmit = async () => {
    if (selected.size < 3) {
      toast({
        title: 'Select at least 3 interests',
        description: 'This helps us personalize your experience',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Batch upsert interests
      const items = Array.from(selected.values()).map(({ interest, affinity }) => ({
        interest_id: interest.id,
        affinity,
        confidence: 'explicit',
        source: 'onboarding'
      }));

      const { error: upsertError } = await supabase.rpc('user_interests_upsert', {
        p_items: items
      });

      if (upsertError) throw upsertError;

      // Enqueue discovery for marketplace
      const { error: discoveryError } = await supabase.rpc('enqueue_discovery_for_user', {
        p_user_id: user.id
      });

      if (discoveryError) console.warn('[InterestsStep] Discovery queue error:', discoveryError);

      // Emit telemetry
      await supabase.rpc('emit_signal', {
        p_name: 'interests_selected',
        p_metadata: { count: selected.size, domains: Array.from(new Set(Array.from(selected.values()).map(v => v.interest.domain))) }
      });

      onComplete();
    } catch (err) {
      console.error('[InterestsStep] Save error:', err);
      toast({
        title: 'Failed to save interests',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Group and filter interests
  const grouped: GroupedInterests = interests.reduce((acc, interest) => {
    const search = searchQuery.toLowerCase();
    if (search && !interest.domain.toLowerCase().includes(search) &&
        !interest.category.toLowerCase().includes(search) &&
        !interest.tag.toLowerCase().includes(search)) {
      return acc;
    }

    if (!acc[interest.domain]) acc[interest.domain] = {};
    if (!acc[interest.domain][interest.category]) acc[interest.domain][interest.category] = [];
    acc[interest.domain][interest.category].push(interest);
    return acc;
  }, {} as GroupedInterests);

  const domains = Object.keys(grouped);
  const displayDomain = activeDomain && grouped[activeDomain] ? activeDomain : domains[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">What Are You Into?</h2>
        <p className="text-muted-foreground">
          Pick your interests so we can personalize your feed and marketplace
        </p>
      </div>

      {/* Selected count badge */}
      {selected.size > 0 && (
        <Badge variant="secondary" className="text-sm">
          {selected.size} selected {selected.size < 3 && `(${3 - selected.size} more needed)`}
        </Badge>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Domain tabs */}
      <div className="flex gap-2 flex-wrap">
        {domains.map((domain) => (
          <Button
            key={domain}
            variant={displayDomain === domain ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveDomain(domain)}
          >
            {domain}
          </Button>
        ))}
      </div>

      {/* Categories and tags */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          {displayDomain && grouped[displayDomain] && Object.entries(grouped[displayDomain]).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold mb-3 text-sm uppercase text-muted-foreground">
                {category}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {items.map((interest) => (
                  <div key={interest.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={interest.id}
                      checked={selected.has(interest.id)}
                      onCheckedChange={() => toggleInterest(interest)}
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
      </ScrollArea>

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || selected.size < 3}
          className="flex-1"
        >
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {loading ? 'Saving...' : `Continue (${selected.size} selected)`}
        </Button>
      </div>

      {selected.size < 3 && (
        <p className="text-sm text-center text-muted-foreground">
          Select at least 3 interests to continue
        </p>
      )}
    </div>
  );
}
