/**
 * Cart Count Hook
 * 
 * Fetches the current cart item count
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCartSessionId } from '@/lib/cart/session';

export function useCartCount() {
  return useQuery({
    queryKey: ['cart-count'],
    queryFn: async () => {
      const sessionId = getCartSessionId();
      const { data, error } = await supabase.rpc('cart_get', { 
        p_session_id: sessionId 
      }) as any;
      
      if (error) {
        console.error('Failed to fetch cart:', error);
        return 0;
      }
      
      const items = data?.items || [];
      return items.reduce((sum: number, item: any) => sum + (item.qty || 0), 0);
    },
    refetchInterval: 5000,
  });
}
