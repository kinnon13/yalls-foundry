import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { entityProfileService } from '@/lib/profiles/entity-service';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Building2, Heart, Package, User, Search, Zap } from 'lucide-react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function UnclaimedEntitiesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch unclaimed entities
  const { data: unclaimedProfiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['entities', 'unclaimed', 'profiles'],
    queryFn: () => entityProfileService.list({ is_claimed: false, limit: 50 }),
  });

  const { data: unclaimedBusinesses = [], isLoading: loadingBusinesses } = useQuery({
    queryKey: ['businesses', 'unclaimed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .is('owner_id', null)
        .limit(50);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: unclaimedHorses = [], isLoading: loadingHorses } = useQuery({
    queryKey: ['horses', 'unclaimed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('horses' as any)
        .select('*')
        .eq('is_claimed', false)
        .limit(50);
      if (error) throw error;
      return data as any[];
    }
  });

  const { data: unclaimedProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'unclaimed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_items' as any)
        .select('*, businesses!inner(*)')
        .is('businesses.owner_id', null)
        .limit(50);
      if (error) throw error;
      return data as any[];
    }
  });

  const filteredProfiles = unclaimedProfiles.filter(p =>
    searchTerm === '' || p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBusinesses = unclaimedBusinesses.filter(b =>
    searchTerm === '' || b.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHorses = unclaimedHorses.filter(h =>
    searchTerm === '' || h.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = unclaimedProducts.filter(p =>
    searchTerm === '' || p.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingProfiles || loadingBusinesses || loadingHorses || loadingProducts) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Unclaimed Entities</h1>
        <p className="text-muted-foreground">
          Entities that have been added to the platform but are not yet claimed by their owners.
          Claim them to manage and update their information.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search unclaimed entities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({filteredProfiles.length + filteredBusinesses.length + filteredHorses.length + filteredProducts.length})
          </TabsTrigger>
          <TabsTrigger value="profiles">
            <User className="h-4 w-4 mr-2" />
            Profiles ({filteredProfiles.length})
          </TabsTrigger>
          <TabsTrigger value="businesses">
            <Building2 className="h-4 w-4 mr-2" />
            Businesses ({filteredBusinesses.length})
          </TabsTrigger>
          <TabsTrigger value="horses">
            <Heart className="h-4 w-4 mr-2" />
            Horses ({filteredHorses.length})
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Products ({filteredProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredProfiles.length === 0 && filteredBusinesses.length === 0 && 
           filteredHorses.length === 0 && filteredProducts.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No unclaimed entities found
              </CardContent>
            </Card>
          )}

          {filteredProfiles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profiles
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProfiles.map((profile) => (
                  <Card key={profile.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{profile.name}</CardTitle>
                        <CardDescription>{profile.entity_type}</CardDescription>
                      </div>
                      <Badge variant="outline">Unclaimed</Badge>
                    </div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => navigate(`/profile`)}
                      >
                        <Zap className="h-4 w-4" />
                        Claim
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredBusinesses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Businesses
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBusinesses.map((business) => (
                  <Card key={business.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{business.name}</CardTitle>
                          <CardDescription>{business.description || 'No description'}</CardDescription>
                        </div>
                        <Badge variant="outline">Unclaimed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => navigate(`/business/${business.id}/hub`)}
                      >
                        <Zap className="h-4 w-4" />
                        Claim
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredHorses.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Horses
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredHorses.map((horse) => (
                  <Card key={horse.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{horse.name}</CardTitle>
                          <CardDescription>
                            {horse.sex && <span>{horse.sex}</span>}
                            {horse.foal_year && <span> • {horse.foal_year}</span>}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Unclaimed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => navigate(`/horses/${horse.id}`)}
                      >
                        <Zap className="h-4 w-4" />
                        Claim
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{product.title}</CardTitle>
                          <CardDescription>
                            ${(product.price / 100).toFixed(2)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">Unclaimed</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        size="sm" 
                        className="w-full gap-2"
                        onClick={() => navigate(`/marketplace/${product.id}`)}
                      >
                        <Zap className="h-4 w-4" />
                        View
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="profiles">
          {filteredProfiles.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No unclaimed profiles found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProfiles.map((profile) => (
                <Card key={profile.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{profile.name}</CardTitle>
                        <CardDescription>{profile.entity_type}</CardDescription>
                      </div>
                      <Badge variant="outline">Unclaimed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => navigate(`/profile`)}
                    >
                      <Zap className="h-4 w-4" />
                      Claim
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="businesses">
          {filteredBusinesses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No unclaimed businesses found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBusinesses.map((business) => (
                <Card key={business.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{business.name}</CardTitle>
                        <CardDescription>{business.description || 'No description'}</CardDescription>
                      </div>
                      <Badge variant="outline">Unclaimed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => navigate(`/business/${business.id}/hub`)}
                    >
                      <Zap className="h-4 w-4" />
                      Claim
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="horses">
          {filteredHorses.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No unclaimed horses found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredHorses.map((horse) => (
                <Card key={horse.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{horse.name}</CardTitle>
                        <CardDescription>
                          {horse.sex && <span>{horse.sex}</span>}
                          {horse.foal_year && <span> • {horse.foal_year}</span>}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">Unclaimed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => navigate(`/horses/${horse.id}`)}
                    >
                      <Zap className="h-4 w-4" />
                      Claim
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No unclaimed products found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{product.title}</CardTitle>
                        <CardDescription>
                          ${(product.price / 100).toFixed(2)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">Unclaimed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => navigate(`/marketplace/${product.id}`)}
                    >
                      <Zap className="h-4 w-4" />
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
