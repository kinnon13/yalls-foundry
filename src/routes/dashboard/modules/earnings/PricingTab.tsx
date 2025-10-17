/**
 * Pricing Tab - A/B tests and price suggestions
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Play, StopCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

type PriceTest = {
  id: string;
  listing_id: string;
  status: 'draft' | 'running' | 'ended' | 'cancelled';
  started_at: string | null;
  ended_at: string | null;
  winner_variant: string | null;
  price_test_variants?: PriceVariant[];
};

type PriceVariant = {
  id: string;
  test_id: string;
  variant_key: string;
  price_cents: number;
};

// Helper to bypass type inference issues
async function queryListings(userId: string) {
  const result = await (supabase as any)
    .from('marketplace_listings')
    .select('id, title, price_cents')
    .eq('seller_user_id', userId)
    .eq('status', 'active');
  if (result.error) throw result.error;
  return result.data || [];
}

async function queryPriceTests(userId: string) {
  const result = await (supabase as any)
    .from('price_tests')
    .select('*')
    .eq('owner_user_id', userId)
    .order('created_at', { ascending: false });
  if (result.error) throw result.error;
  return result.data || [];
}

async function queryPriceVariants(testId: string) {
  const result = await (supabase as any)
    .from('price_test_variants')
    .select('*')
    .eq('test_id', testId);
  return result.data || [];
}

export function PricingTab() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedListing, setSelectedListing] = useState<string>('');

  const { data: listings } = useQuery({
    queryKey: ['user-listings', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return [];
      return await queryListings(session.userId);
    },
    enabled: !!session?.userId,
  });

  const { data: tests } = useQuery<PriceTest[]>({
    queryKey: ['price-tests', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return [];
      const testData = await queryPriceTests(session.userId);
      
      const testsWithVariants = await Promise.all(testData.map(async (test: any) => {
        const variants = await queryPriceVariants(test.id);
        return { ...test, price_test_variants: variants };
      }));
      
      return testsWithVariants;
    },
    enabled: !!session?.userId,
  });

  const { data: suggestions } = useQuery<any>({
    queryKey: ['price-suggestions', selectedListing],
    queryFn: async () => {
      if (!selectedListing) return null;
      const { data, error } = await (supabase as any).rpc('get_price_suggestions', {
        p_listing_id: selectedListing,
      });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedListing,
  });

  const startTest = useMutation({
    mutationFn: async (params: { listing_id: string; variants: Array<{ variant: string; price_cents: number }> }) => {
      const { data, error } = await (supabase as any).rpc('start_price_test', {
        p_listing_id: params.listing_id,
        p_variants: params.variants,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-tests'] });
      toast.success('Price test started');
      setShowForm(false);
    },
  });

  const endTest = useMutation({
    mutationFn: async (params: { test_id: string; winner?: string }) => {
      const { data, error } = await (supabase as any).rpc('end_price_test', {
        p_test_id: params.test_id,
        p_winner: params.winner || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-tests'] });
      toast.success('Price test ended');
    },
  });

  const running = tests?.filter(t => t.status === 'running') || [];
  const ended = tests?.filter(t => t.status === 'ended') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pricing</h2>
          <p className="text-sm text-muted-foreground">A/B test prices and get suggestions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Play className="w-4 h-4 mr-2" />
          Start Test
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Price Test</CardTitle>
            <CardDescription>Test two prices to see which converts better</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Listing</Label>
              <Select value={selectedListing} onValueChange={setSelectedListing}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a listing" />
                </SelectTrigger>
                <SelectContent>
                  {listings?.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title} (${(l.price_cents / 100).toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedListing && suggestions && typeof suggestions === 'object' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  Suggested Prices
                </div>
                <div className="grid gap-2">
                  {(suggestions as any).suggestions?.map((s: any, i: number) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        startTest.mutate({
                          listing_id: selectedListing,
                          variants: [
                            { variant: 'A', price_cents: (suggestions as any).current },
                            { variant: 'B', price_cents: s.price_cents },
                          ],
                        });
                      }}
                    >
                      Test {s.label}: ${(s.price_cents / 100).toFixed(2)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <PriceVariantInput label="Variant A" defaultValue={(suggestions as any)?.current} />
              <PriceVariantInput label="Variant B" defaultValue={(suggestions as any)?.suggestions?.[0]?.price_cents} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Running Tests */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Play className="w-5 h-5 text-green-500" />
          Running Tests ({running.length})
        </h3>
        <div className="space-y-4">
          {running.map(test => (
            <TestCard
              key={test.id}
              test={test}
              onEnd={(winner) => endTest.mutate({ test_id: test.id, winner })}
            />
          ))}
          {running.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No active tests
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ended Tests */}
      {ended.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Past Tests ({ended.length})</h3>
          <div className="space-y-4">
            {ended.slice(0, 3).map(test => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceVariantInput({ label, defaultValue }: { label: string; defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue ? (defaultValue / 100).toFixed(2) : '');
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0.00"
      />
    </div>
  );
}

function TestCard({ test, onEnd }: { test: PriceTest; onEnd?: (winner: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Price Test</CardTitle>
            <CardDescription>
              {test.started_at && `Started ${new Date(test.started_at).toLocaleDateString()}`}
            </CardDescription>
          </div>
          <Badge variant={test.status === 'running' ? 'default' : 'outline'}>
            {test.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 mb-4">
          {test.price_test_variants?.map(v => (
            <div key={v.id} className="p-3 border rounded-lg">
              <div className="text-sm font-medium mb-1">Variant {v.variant_key}</div>
              <div className="text-2xl font-bold">${(v.price_cents / 100).toFixed(2)}</div>
              {test.winner_variant === v.variant_key && (
                <Badge className="mt-2" variant="default">Winner</Badge>
              )}
            </div>
          ))}
        </div>
        {test.status === 'running' && onEnd && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onEnd(test.price_test_variants?.[0]?.variant_key || 'A')}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            End Test
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
