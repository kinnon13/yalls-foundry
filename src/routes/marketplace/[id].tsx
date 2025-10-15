/**
 * Marketplace Listing Detail
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getListingById, addToCart } from '@/lib/marketplace/service.supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SEOHelmet } from '@/lib/seo/helmet';
import { formatPrice } from '@/entities/marketplace';
import { toast } from 'sonner';
import { ArrowLeft, ShoppingCart, Plus, Minus } from 'lucide-react';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingById(id!),
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: (qty: number) => addToCart(id!, qty),
    onSuccess: () => {
      toast.success('Added to cart!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add to cart');
    },
  });

  const handleAddToCart = () => {
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
                <p className="text-4xl font-bold">{formatPrice(listing.base_price_cents)}</p>
              </div>

              {listing.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{listing.description}</p>
                </div>
              )}

              {listing.tags && listing.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex gap-2 flex-wrap">
                    {listing.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
