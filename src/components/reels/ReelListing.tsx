/**
 * Reel Listing Card
 * Full-bleed carousel, price chip, 1-tap Add to Cart
 */

import { useState } from 'react';
import { ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsageEvent } from '@/hooks/useUsageEvent';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ReelListingProps {
  data: {
    seller_entity_id: string;
    title: string;
    description: string;
    price_cents: number;
    media?: any[];
    stock_quantity: number;
    status: string;
  };
  itemId: string;
}

export function ReelListing({ data, itemId }: ReelListingProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const logUsageEvent = useUsageEvent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasMedia = data.media && data.media.length > 0;
  const images = hasMedia ? data.media.filter((m: any) => m.type === 'image') : [];

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      const sessionId = sessionStorage.getItem('cart_session_id') || crypto.randomUUID();
      sessionStorage.setItem('cart_session_id', sessionId);

      const { error } = await supabase.rpc('cart_upsert_item', {
        p_listing_id: itemId,
        p_qty: 1,
        p_session_id: sessionId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Added to cart!' });
      logUsageEvent('add_to_cart', 'listing', itemId);
    },
    onError: () => {
      toast({ title: 'Failed to add to cart', variant: 'destructive' });
    },
  });

  const handleSave = async () => {
    setSaved(!saved);
    logUsageEvent('click', 'listing', itemId, { action: 'save' });
    // TODO: Call save RPC when implemented
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-card rounded-lg overflow-hidden shadow-lg animate-scale-in">
      {/* Image Carousel */}
      {images.length > 0 && (
        <div className="relative w-full aspect-[4/5] bg-muted">
          <img
            src={images[currentImageIndex].url}
            alt={data.title}
            className="w-full h-full object-cover"
          />

          {/* Carousel Controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
              >
                <ChevronRight size={20} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Price Chip */}
          <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
            ${(data.price_cents / 100).toFixed(2)}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
          >
            <Heart size={18} className={saved ? 'fill-current' : ''} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{data.title}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{data.description}</p>

        {/* Stock Badge */}
        {data.stock_quantity < 5 && (
          <p className="text-xs text-destructive mb-3">Only {data.stock_quantity} left!</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending || data.stock_quantity === 0}
          >
            <ShoppingCart size={18} className="mr-2" />
            {data.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
          <Button variant="outline" size="icon">
            <Heart size={18} className={saved ? 'fill-current text-destructive' : ''} />
          </Button>
        </div>

        {/* More from seller */}
        <button className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors">
          More from this seller →
        </button>
      </div>
    </div>
  );
}
