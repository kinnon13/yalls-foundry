/**
 * Role: One-tap shopping component embedded in social feeds (Yall Mart integration)
 * Path: yalls-inc/yalls-social/src/components/QuickBuy.tsx
 * Responsive: fixed bottom-0 sm:relative for mobile quick-buy
 * Imports: @/integrations/supabase/client
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuickBuyProps {
  productId: string;
  postId: string;
}

export function QuickBuy({ productId, postId }: QuickBuyProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { toast } = useToast();

  const handleQuickBuy = async () => {
    setIsAdding(true);
    try {
      // Stub: Call yallmart cart service
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('yallmart_cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
          source_post_id: postId,
        });

      if (error) throw error;

      setAdded(true);
      toast({
        title: 'Added to cart',
        description: 'Product added from social feed',
      });

      setTimeout(() => setAdded(false), 2000);
    } catch (error) {
      console.error('Quick buy error:', error);
      toast({
        title: 'Failed to add',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={handleQuickBuy}
      disabled={isAdding || added}
      size="sm"
      className="w-full gap-2 sm:w-auto"
      variant={added ? 'outline' : 'default'}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          Added
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          {isAdding ? 'Adding...' : 'Quick Buy'}
        </>
      )}
    </Button>
  );
}
