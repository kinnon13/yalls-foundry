import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Plus, ShoppingCart } from 'lucide-react';
import { useSession } from '@/lib/auth/context';

export default function ListingsIndex() {
  const { session } = useSession();
  
  const { data: listings, isLoading } = useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings' as any)
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    }
  });

  const handleAddToCart = async (listingId: string) => {
    const { error } = await supabase.rpc('cart_upsert_item', {
      p_listing_id: listingId,
      p_qty: 1,
      p_variant: {}
    } as any);
    
    if (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground mt-1">Browse active listings</p>
          </div>
          {session && (
            <Link to="/listings/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Listing
              </Button>
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : !listings?.length ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No active listings yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardHeader>
                  <CardTitle>{listing.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{listing.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${(listing.price_cents / 100).toFixed(2)}
                    </span>
                    <Badge variant="secondary">{listing.stock_qty} in stock</Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link to={`/listings/${listing.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                  <Button onClick={() => handleAddToCart(listing.id)} size="icon">
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
