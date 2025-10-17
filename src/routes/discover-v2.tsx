/**
 * Discover V2 - Popular + Shopping with Facets
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Star } from 'lucide-react';

export default function DiscoverV2() {
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const navigate = useNavigate();

  const { data: listings = [] } = useQuery({
    queryKey: ['discover-listings', priceRange, selectedTags],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .gte('price_cents', priceRange[0] * 100)
        .lte('price_cents', priceRange[1] * 100)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data } = await query;
      
      // Log views to ai_action_ledger
      if (data && data.length > 0) {
        await supabase.from('ai_action_ledger').insert({
          agent: 'user',
          action: 'discover_view',
          input: { tab: 'discover', count: data.length },
          output: {},
          result: 'success'
        });
      }
      
      return data || [];
    },
  });

  const { data: taxonomies = [] } = useQuery({
    queryKey: ['taxonomies'],
    queryFn: async () => {
      const { data } = await supabase
        .from('taxonomies')
        .select('*, taxonomy_values(*)')
        .limit(10);

      return data || [];
    },
  });

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Discover</h1>

      {/* Facets Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          {/* Price Range */}
          <div>
            <div className="text-sm font-medium mb-2">
              Price: ${priceRange[0]} - ${priceRange[1]}
            </div>
            <Slider
              value={priceRange}
              onValueChange={setPriceRange}
              min={0}
              max={10000}
              step={100}
            />
          </div>

          {/* Categories */}
          {taxonomies.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Categories</div>
              <div className="flex flex-wrap gap-2">
                {taxonomies.flatMap((tax: any) =>
                  tax.taxonomy_values?.slice(0, 5).map((val: any) => (
                    <Badge
                      key={val.id}
                      variant={selectedTags.includes(val.value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(val.value)}
                    >
                      {val.value}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="trending">
        <TabsList className="mb-6">
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="latest">
            <Clock className="h-4 w-4 mr-2" />
            Latest
          </TabsTrigger>
          <TabsTrigger value="popular">
            <Star className="h-4 w-4 mr-2" />
            Popular
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trending">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing: any) => (
              <Card
                key={listing.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/listings/${listing.id}`)}
              >
                {listing.media?.[0]?.url && (
                  <img
                    src={listing.media[0].url}
                    alt={listing.title}
                    className="w-full h-48 object-cover rounded-t"
                  />
                )}
                <CardContent className="pt-4">
                  <h3 className="font-semibold line-clamp-2">{listing.title}</h3>
                  <div className="text-lg font-bold mt-2">
                    ${(listing.price_cents / 100).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="latest">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {listings.map((listing: any) => (
              <Card
                key={listing.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/listings/${listing.id}`)}
              >
                <CardContent className="pt-6">
                  <h3 className="font-semibold">{listing.title}</h3>
                  <div className="text-lg font-bold mt-2">
                    ${(listing.price_cents / 100).toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="popular">
          <div className="text-center py-12 text-muted-foreground">
            Popular items coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
