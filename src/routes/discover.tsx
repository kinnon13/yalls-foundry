/**
 * PR C3: Discover Page (Popular Feed)
 * For You / Trending / Latest sections with faceted search
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs } from '@/design/components/Tabs';
import { Card } from '@/design/components/Card';
import { Badge } from '@/design/components/Badge';
import { Price } from '@/design/components/Price';
import { supabase } from '@/integrations/supabase/client';
import { tokens } from '@/design/tokens';
import { useSearchParams } from 'react-router-dom';

export default function Discover() {
  const [activeTab, setActiveTab] = useState('for-you');
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedFacets = searchParams.get('facets')?.split(',') || [];

  const { data: taxonomies = [] } = useQuery({
    queryKey: ['taxonomies'],
    queryFn: async () => {
      const { data } = await supabase.from('taxonomies').select('*');
      return data || [];
    },
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['discover-listings', activeTab, selectedFacets],
    queryFn: async () => {
      // Mock data for now - real implementation would query marketplace
      return [];
    },
  });

  const handleFacetToggle = (facetKey: string) => {
    const updated = selectedFacets.includes(facetKey)
      ? selectedFacets.filter(f => f !== facetKey)
      : [...selectedFacets, facetKey];
    
    if (updated.length > 0) {
      searchParams.set('facets', updated.join(','));
    } else {
      searchParams.delete('facets');
    }
    setSearchParams(searchParams);
  };

  const tabs = [
    {
      id: 'for-you',
      label: 'For You',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: tokens.space.m }}>
          {listings.map((listing: any) => (
            <Card key={listing.id} padding="m">
              <div style={{ fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.xs }}>
                {listing.title}
              </div>
              <Price cents={listing.price_cents} />
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'trending',
      label: 'Trending',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: tokens.space.m }}>
          {listings.map((listing: any) => (
            <Card key={listing.id} padding="m">
              <div style={{ fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.xs }}>
                {listing.title}
              </div>
              <Price cents={listing.price_cents} />
              <Badge variant="warning">🔥 Trending</Badge>
            </Card>
          ))}
        </div>
      ),
    },
    {
      id: 'latest',
      label: 'Latest',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: tokens.space.m }}>
          {listings.map((listing: any) => (
            <Card key={listing.id} padding="m">
              <div style={{ fontWeight: tokens.typography.weight.semibold, marginBottom: tokens.space.xs }}>
                {listing.title}
              </div>
              <Price cents={listing.price_cents} />
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: tokens.space.m }}>
      <div style={{ marginBottom: tokens.space.m }}>
        <h2 style={{ fontSize: tokens.typography.size.xxl, fontWeight: tokens.typography.weight.bold, marginBottom: tokens.space.s }}>
          Discover
        </h2>
        <div style={{ display: 'flex', gap: tokens.space.xs, flexWrap: 'wrap' }}>
          {taxonomies.slice(0, 10).map((tax: any) => (
            <Badge
              key={tax.id}
              variant={selectedFacets.includes(tax.key) ? 'default' : 'warning'}
            >
              {tax.label}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
