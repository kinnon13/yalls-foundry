/**
 * Marketplace Listing Detail
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { getListingById, addToCart } from '@/lib/marketplace/service';
import { getCartSessionId } from '@/lib/cart/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SEOHelmet } from '@/lib/seo/helmet';
import { formatPrice } from '@/entities/marketplace';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';
import { FlagContentDialog } from '@/components/marketplace/FlagContentDialog';
import { usePersonalization } from '@/hooks/usePersonalization';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const { trackInteraction } = usePersonalization();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const listing = await getListingById(id!);
      // Track view
      if (listing) {
        trackInteraction('view', 'marketplace_listings', listing.id, {
          category: listing.category_id,
        });
      }
      return listing;
    },
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: async (qty: number) => {
      const sessionId = getCartSessionId();
      if (!sessionId) throw new Error('No session');
      return addToCart(id!, qty, sessionId);
    },
    onSuccess: () => {
      toast.success('Added to cart!', {
        action: {
          label: 'View Cart',
          onClick: () => {
            const params = new URLSearchParams(searchParams);
            params.set('modal', 'cart');
            setSearchParams(params);
          },
        },
      });
      queryClient.invalidateQueries({ queryKey: ['cart-count'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to cart');
    },
  });

  const handleAddToCart = () => {
    if (listing) {
      trackInteraction('click', 'marketplace_listings', listing.id, {
        action: 'add_to_cart',
        quantity,
      });
    }
    addToCartMutation.mutate(quantity);
  };

  const incrementQty = () => {
    if (listing && quantity < listing.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQty = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Link to="/marketplace">
            <Button variant="outline">Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet 
        title={listing.title} 
        description={listing.description || 'View product details'} 
      />
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>

          {/* Product Details */}
          <Card>
            <CardHeader>
              {listing.images?.[0] && (
                <div className="w-full h-96 bg-muted rounded-md mb-6 overflow-hidden">
                  <img 
                    src={listing.images[0]} 
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <CardTitle className="text-3xl">{listing.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {listing.category && (
                    <Badge variant="outline">{listing.category}</Badge>
                  )}
                  <Badge variant={listing.stock_quantity > 0 ? 'default' : 'destructive'}>
                    {listing.stock_quantity > 0 ? `${listing.stock_quantity} in stock` : 'Out of stock'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-4xl font-bold">{formatPrice(listing.price_cents)}</p>
              </div>

              {listing.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{listing.description}</p>
                </div>
              )}

              {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(listing.attributes as Record<string, any>).map(([key, value]) => (
                      <Badge key={key} variant="secondary">{key}: {value}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to Cart */}
              {listing.stock_quantity > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={decrementQty}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 1 && val <= listing.stock_quantity) {
                            setQuantity(val);
                          }
                        }}
                        className="w-20 text-center"
                        min={1}
                        max={listing.stock_quantity}
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={incrementQty}
                        disabled={quantity >= listing.stock_quantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full gap-2"
                    onClick={handleAddToCart}
                    disabled={addToCartMutation.isPending}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                  </Button>
                </div>
              )}

              {/* Flag Content */}
              <div className="pt-4 border-t">
                <FlagContentDialog
                  contentType="listing"
                  contentId={listing.id}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full">
                      Report this listing
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
