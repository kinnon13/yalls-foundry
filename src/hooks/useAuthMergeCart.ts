/**
 * Auto-merge guest cart on login
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mergeGuestCart } from '@/lib/cart/session';
import { toast } from 'sonner';

export function useAuthMergeCart() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          try {
            await mergeGuestCart(supabase);
            await queryClient.invalidateQueries({ queryKey: ['cart'] });
            await queryClient.invalidateQueries({ queryKey: ['cart-count'] });
            toast.success('Cart items merged');
          } catch (error) {
            console.error('Failed to merge cart:', error);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [queryClient]);
}
