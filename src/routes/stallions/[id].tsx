/**
 * Stallion Profile Page
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function StallionProfile() {
  const { id } = useParams();

  const { data: stallion, isLoading } = useQuery({
    queryKey: ['stallion', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stallion_profiles')
        .select('*, entities!stallion_profiles_entity_id_fkey(id, display_name, handle, metadata, owner_user_id, profiles!entities_owner_user_id_fkey(display_name, avatar_url))')
        .eq('entity_id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const { data: offspring } = useQuery({
    queryKey: ['offspring', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('breeding_records')
        .select('*, entities!breeding_records_foal_entity_id_fkey(display_name, handle)')
        .eq('stallion_entity_id', id)
        .eq('outcome', 'foaled')
        .order('breeding_date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!stallion) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          Stallion not found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{stallion.entities?.display_name}</h1>
          {stallion.entities?.handle && (
            <p className="text-muted-foreground">@{stallion.entities.handle}</p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Image */}
          <div className="md:col-span-2">
            {stallion.media?.[0]?.url ? (
              <img
                src={stallion.media[0].url}
                alt={stallion.entities?.display_name}
                className="w-full rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                No image
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Breeding Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stallion.stud_fee_cents && (
                  <div>
                    <p className="text-sm text-muted-foreground">Stud Fee</p>
                    <p className="text-2xl font-bold text-primary">
                      ${(stallion.stud_fee_cents / 100).toLocaleString()}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm capitalize ${
                    stallion.breeding_status === 'available' ? 'bg-green-100 text-green-800' :
                    stallion.breeding_status === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {stallion.breeding_status}
                  </span>
                </div>

                {stallion.offspring_count > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Offspring</p>
                    <p className="text-xl font-semibold">{stallion.offspring_count}</p>
                  </div>
                )}

                {stallion.entities?.profiles?.[0] && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Owner</p>
                    <div className="flex items-center gap-2">
                      {stallion.entities.profiles[0].avatar_url && (
                        <img
                          src={stallion.entities.profiles[0].avatar_url}
                          alt={stallion.entities.profiles[0].display_name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <span>{stallion.entities.profiles[0].display_name}</span>
                    </div>
                  </div>
                )}

                <Button className="w-full">Contact Owner</Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mt-8">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="offspring">Offspring</TabsTrigger>
            <TabsTrigger value="genetics">Genetics</TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <Card>
              <CardContent className="pt-6">
                {stallion.temperament_notes && (
                  <div className="mb-4">
                    <h3 className="font-semibold mb-2">Temperament</h3>
                    <p className="text-muted-foreground">{stallion.temperament_notes}</p>
                  </div>
                )}

                {stallion.breeding_record && Object.keys(stallion.breeding_record).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Breeding Record</h3>
                    <pre className="text-sm text-muted-foreground">
                      {JSON.stringify(stallion.breeding_record, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offspring">
            <Card>
              <CardContent className="pt-6">
                {offspring?.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No offspring records yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {offspring?.map((record: any) => (
                      <div key={record.id} className="border-b pb-4 last:border-0">
                        <Link
                          to={`/entities/${record.foal_entity_id}`}
                          className="font-semibold hover:text-primary"
                        >
                          {record.entities?.display_name}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Born: {new Date(record.breeding_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="genetics">
            <Card>
              <CardContent className="pt-6">
                {stallion.genetics && Object.keys(stallion.genetics).length > 0 ? (
                  <pre className="text-sm">
                    {JSON.stringify(stallion.genetics, null, 2)}
                  </pre>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No genetic information available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
