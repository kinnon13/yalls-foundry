/**
 * Stallion Directory - Browse & Search
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function StallionsDirectory() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const { data: stallions, isLoading } = useQuery({
    queryKey: ['stallions', search, status],
    queryFn: async () => {
      let query = supabase
        .from('stallion_profiles')
        .select('*, entities!stallion_profiles_entity_id_fkey(id, display_name, handle, metadata)')
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('breeding_status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by search on client side
      if (search) {
        return data?.filter((s: any) =>
          s.entities?.display_name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      return data;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Stallion Directory</h1>

        {/* Search & Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search stallions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            {['all', 'available', 'limited', 'retired'].map((s) => (
              <Button
                key={s}
                variant={status === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus(s)}
                className="capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Stallions Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : stallions?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No stallions found
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {stallions?.map((stallion: any) => (
              <Link key={stallion.entity_id} to={`/stallions/${stallion.entity_id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {stallion.media?.[0]?.url && (
                      <img
                        src={stallion.media[0].url}
                        alt={stallion.entities?.display_name}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">
                        {stallion.entities?.display_name}
                      </h3>
                      {stallion.stud_fee_cents && (
                        <p className="text-xl font-semibold text-primary mb-2">
                          ${(stallion.stud_fee_cents / 100).toLocaleString()} stud fee
                        </p>
                      )}
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        stallion.breeding_status === 'available' ? 'bg-green-100 text-green-800' :
                        stallion.breeding_status === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {stallion.breeding_status}
                      </span>
                      {stallion.offspring_count > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {stallion.offspring_count} offspring
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
