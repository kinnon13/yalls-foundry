import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Edit, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*, entities!seller_entity_id(display_name)')
        .eq('id', id!)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  // Rocker hook: track 2nd view in 7 days
  useEffect(() => {
    if (!listing) return;
    
    const viewKey = `listing_view_${id}`;
    const lastView = localStorage.getItem(viewKey);
    const now = Date.now();
    
    if (lastView) {
      const daysSince = (now - parseInt(lastView)) / (1000 * 60 * 60 * 24);
      if (daysSince <= 7) {
        // 2nd view within 7 days - nudge
        supabase.rpc('rocker_log_action', {
          p_user_id: (async () => (await supabase.auth.getUser()).data.user?.id)(),
          p_agent: 'rocker',
          p_action: 'nudge_prefill_cart',
          p_input: { listing_id: id },
          p_output: { nudge_shown: true },
          p_result: 'success'
        });
      }
    }
    
    localStorage.setItem(viewKey, now.toString());
  }, [id, listing]);

  const handleAddToCart = async () => {
    const { error } = await supabase.rpc('cart_upsert_item', {
      p_listing_id: id!,
      p_qty: 1,
      p_variant: {}
    });
    
    if (error) {
      toast.error('Failed to add to cart');
    } else {
      toast.success('Added to cart');
    }
  };

  const handleShareEarn = () => {
    const url = `${window.location.origin}/listings/${id}?ref=placeholder`;
    navigator.clipboard.writeText(url);
    toast.success('Referral link copied! (Phase 4: actual tracking)');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Listing not found</p>
          <Link to="/listings">
            <Button className="mt-4">Back to Listings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl">{listing.title}</CardTitle>
                <CardDescription className="text-lg mt-2">
                  by {(listing.entities as any)?.display_name || 'Unknown'}
                </CardDescription>
              </div>
              <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                {listing.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-4xl font-bold">
              ${(listing.price_cents / 100).toFixed(2)}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{listing.description || 'No description'}</p>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="secondary">{listing.stock_qty} in stock</Badge>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddToCart} disabled={listing.stock_qty === 0}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
              
              <Button variant="outline" onClick={handleShareEarn}>
                <Share2 className="h-4 w-4 mr-2" />
                Share & Earn
              </Button>

              {/* Show edit if owner */}
              <Link to={`/listings/${id}/edit`}>
                <Button variant="ghost">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
