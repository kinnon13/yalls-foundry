import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, Users, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ConnectedEntitiesPanel() {
  const navigate = useNavigate();

  const { data: businesses, isLoading: loadingBusinesses } = useQuery({
    queryKey: ['my-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: horses, isLoading: loadingHorses } = useQuery({
    queryKey: ['my-horses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('horses' as any)
        .select('*')
        .eq('primary_owner_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) throw error;
      return data as any[];
    }
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['my-products'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('marketplace_items' as any)
        .select('*, businesses!inner(owner_id)')
        .eq('businesses.owner_id', userId);
      
      if (error) throw error;
      return data as any[];
    }
  });

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['my-profiles'],
    queryFn: async () => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId);
      
      if (error) throw error;
      return data;
    }
  });

  if (loadingBusinesses || loadingHorses || loadingProducts || loadingProfiles) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Connected Accounts & Entities</h2>
        <p className="text-muted-foreground">
          Manage all your connected businesses, horses, products, and profiles
        </p>
      </div>

      {/* Profiles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Profiles</CardTitle>
            </div>
            <Badge variant="secondary">{profiles?.length || 0}</Badge>
          </div>
          <CardDescription>Your user profiles and claimed identities</CardDescription>
        </CardHeader>
        <CardContent>
          {profiles && profiles.length > 0 ? (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {profile.avatar_url && (
                      <img src={profile.avatar_url} alt={profile.display_name} className="h-10 w-10 rounded-full" />
                    )}
                    <div>
                      <p className="font-medium">{profile.display_name}</p>
                      {profile.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No profiles found</p>
          )}
        </CardContent>
      </Card>

      {/* Businesses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <CardTitle>Businesses</CardTitle>
            </div>
            <Badge variant="secondary">{businesses?.length || 0}</Badge>
          </div>
          <CardDescription>Businesses you own or manage</CardDescription>
        </CardHeader>
        <CardContent>
          {businesses && businesses.length > 0 ? (
            <div className="space-y-2">
              {businesses.map((business) => (
                <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{business.name}</p>
                    {business.description && (
                      <p className="text-sm text-muted-foreground">{business.description}</p>
                    )}
                    {business.frozen && (
                      <Badge variant="destructive" className="mt-1">Frozen</Badge>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/business/${business.id}/hub`)}>
                    Manage
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No businesses found</p>
          )}
        </CardContent>
      </Card>

      {/* Horses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <CardTitle>Horses</CardTitle>
            </div>
            <Badge variant="secondary">{horses?.length || 0}</Badge>
          </div>
          <CardDescription>Horses you own or manage</CardDescription>
        </CardHeader>
        <CardContent>
          {horses && horses.length > 0 ? (
            <div className="space-y-2">
              {horses.map((horse) => (
                <div key={horse.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{horse.name}</p>
                    <div className="flex gap-2 mt-1">
                      {horse.sex && <Badge variant="outline">{horse.sex}</Badge>}
                      {horse.foal_year && <Badge variant="outline">{horse.foal_year}</Badge>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/horses/${horse.id}`)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No horses found</p>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle>Products</CardTitle>
            </div>
            <Badge variant="secondary">{products?.length || 0}</Badge>
          </div>
          <CardDescription>Products you're selling in the marketplace</CardDescription>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.title}</p>
                    {product.price && (
                      <p className="text-sm text-muted-foreground">${(product.price / 100).toFixed(2)}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/marketplace/${product.id}`)}>
                    View
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No products found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
