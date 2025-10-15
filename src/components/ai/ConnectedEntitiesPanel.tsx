import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, Users, Heart, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/lib/auth/context';
import { useState } from 'react';

const PAGE_SIZE = 20;

export function ConnectedEntitiesPanel() {
  const navigate = useNavigate();
  const { session } = useSession();
  const userId = session?.userId;
  
  const [pages, setPages] = useState({
    businesses: 0,
    horses: 0,
    products: 0
  });

  // Fetch profile (at most 1 row)
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch businesses with pagination
  const { data: businessesData, isLoading: loadingBusinesses } = useQuery({
    queryKey: ['my-businesses', userId, pages.businesses],
    queryFn: async () => {
      if (!userId) return { items: [], total: 0 };
      const start = pages.businesses * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      
      const { data, error, count } = await supabase
        .from('businesses')
        .select('id, name, description, created_at, slug, frozen', { count: 'exact' })
        .eq('owner_id', userId)
        .range(start, end)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { items: data || [], total: count || 0 };
    },
    enabled: !!userId,
  });

  // Fetch horses with pagination
  const { data: horsesData, isLoading: loadingHorses } = useQuery({
    queryKey: ['my-horses', userId, pages.horses],
    queryFn: async () => {
      if (!userId) return { items: [], total: 0 };
      const start = pages.horses * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      
      const { data, error, count } = await supabase
        .from('horses' as any)
        .select('id, name, sex, foal_year, created_at', { count: 'exact' })
        .eq('primary_owner_id', userId)
        .range(start, end)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { items: (data as any[]) || [], total: count || 0 };
    },
    enabled: !!userId,
  });

  // Fetch products with pagination  
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['my-products', userId, pages.products],
    queryFn: async () => {
      if (!userId) return { items: [], total: 0 };
      const start = pages.products * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      
      const { data, error, count } = await supabase
        .from('marketplace_items' as any)
        .select('id, title, price, stock_quantity, business_id, businesses!inner(id, name, owner_id)', { count: 'exact' })
        .eq('businesses.owner_id', userId)
        .range(start, end)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { items: (data as any[]) || [], total: count || 0 };
    },
    enabled: !!userId,
  });

  const businesses = businessesData?.items || [];
  const horses = horsesData?.items || [];
  const products = productsData?.items || [];

  const isLoading = loadingProfile || loadingBusinesses || loadingHorses || loadingProducts;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const hasAnyEntities = profile || businesses.length > 0 || horses.length > 0 || products.length > 0;

  const Pagination = ({ current, total, onChange }: { current: number; total: number; onChange: (page: number) => void }) => {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(Math.max(0, current - 1))}
          disabled={current === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {current + 1} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onChange(Math.min(totalPages - 1, current + 1))}
          disabled={current >= totalPages - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Connected Accounts & Entities</h2>
        <p className="text-muted-foreground">
          Manage all your connected businesses, horses, products, and profiles
        </p>
      </div>

      {!hasAnyEntities && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No connected entities yet
          </CardContent>
        </Card>
      )}

      {/* Profile */}
      {profile && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Your Profile</CardTitle>
                {(profile as any)?.tombstone && (
                  <Badge variant="destructive">Profile Closed</Badge>
                )}
              </div>
            </div>
            <CardDescription>Your user profile and identity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {profile.avatar_url && (
                  <img src={profile.avatar_url} alt={profile.display_name} className="h-10 w-10 rounded-full" />
                )}
                <div>
                  <p className="font-medium">{profile.display_name || 'No display name'}</p>
                  {profile.bio && <p className="text-sm text-muted-foreground line-clamp-1">{profile.bio}</p>}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Businesses */}
      {(businesses.length > 0 || businessesData?.total) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <CardTitle>Businesses</CardTitle>
              </div>
              <Badge variant="secondary">{businessesData?.total || 0}</Badge>
            </div>
            <CardDescription>Businesses you own or manage</CardDescription>
          </CardHeader>
          <CardContent>
            {businesses.length > 0 ? (
              <div className="space-y-2">
                {businesses.map((business) => (
                  <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{business.name}</p>
                      {business.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{business.description}</p>
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
                <Pagination 
                  current={pages.businesses} 
                  total={businessesData?.total || 0}
                  onChange={(page) => setPages(p => ({ ...p, businesses: page }))}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No businesses found</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Horses */}
      {(horses.length > 0 || horsesData?.total) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                <CardTitle>Horses</CardTitle>
              </div>
              <Badge variant="secondary">{horsesData?.total || 0}</Badge>
            </div>
            <CardDescription>Horses you own or manage</CardDescription>
          </CardHeader>
          <CardContent>
            {horses.length > 0 ? (
              <div className="space-y-2">
                {horses.map((horse) => (
                  <div key={horse.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
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
                <Pagination 
                  current={pages.horses} 
                  total={horsesData?.total || 0}
                  onChange={(page) => setPages(p => ({ ...p, horses: page }))}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No horses found</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products */}
      {(products.length > 0 || productsData?.total) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle>Products</CardTitle>
              </div>
              <Badge variant="secondary">{productsData?.total || 0}</Badge>
            </div>
            <CardDescription>Products you're selling in the marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            {products.length > 0 ? (
              <div className="space-y-2">
                {products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
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
                <Pagination 
                  current={pages.products} 
                  total={productsData?.total || 0}
                  onChange={(page) => setPages(p => ({ ...p, products: page }))}
                />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No products found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
