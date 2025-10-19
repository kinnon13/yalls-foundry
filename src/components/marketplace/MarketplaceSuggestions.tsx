/**
 * Marketplace Suggestions - Personalized based on interests
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ExternalLink, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  interest_id: string;
  category_id: string;
  source: string;
  title: string;
  url: string | null;
  price_cents: number | null;
  currency: string;
  image_url: string | null;
  score: number;
}

interface MarketplaceSuggestionsProps {
  limit?: number;
}

export function MarketplaceSuggestions({ limit = 12 }: MarketplaceSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('marketplace_suggestions_for_user', {
        p_user_id: user.id,
        p_limit: limit
      });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('[MarketplaceSuggestions] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (listing: Suggestion) => {
    if (listing.source !== 'internal') {
      toast({
        title: 'External item',
        description: 'This item is from a partner. Opening link...'
      });
      if (listing.url) window.open(listing.url, '_blank');
      return;
    }

    try {
      // TODO: Implement cart add
      toast({
        title: 'Added to cart',
        description: listing.title
      });

      await supabase.rpc('emit_signal', {
        p_name: 'add_to_cart',
        p_metadata: { listing_id: listing.category_id }
      });
    } catch (err) {
      console.error('[MarketplaceSuggestions] Cart error:', err);
      toast({
        title: 'Error',
        description: 'Failed to add to cart',
        variant: 'destructive'
      });
    }
  };

  if (suggestions.length === 0 && !loading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No marketplace suggestions yet. Add more interests to discover products!
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {suggestions.map((item, idx) => (
        <Card key={idx} className="overflow-hidden">
          {/* Image */}
          <div className="aspect-square bg-muted relative">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
            {item.source !== 'internal' && (
              <Badge className="absolute top-2 right-2" variant="secondary">
                Partner
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h4 className="font-semibold line-clamp-2 text-sm">
                {item.title}
              </h4>
              {item.price_cents && (
                <div className="text-lg font-bold mt-1">
                  ${(item.price_cents / 100).toFixed(2)}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleAddToCart(item)}
              >
                {item.source === 'internal' ? (
                  <>
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline">
                <Heart className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
