/**
 * Role: React hook for cart management with optimistic updates
 * Path: yalls-inc/yallmart/src/hooks/useCart.ts
 * Imports: @tanstack/react-query, @/lib/auth/context
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth/context';
import { fetchCart, addToCart, removeFromCart, updateQuantity, clearCart } from '../services/cart.service';

export function useCart() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.userId || '';

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['yallmart-cart', userId],
    queryFn: () => fetchCart(userId),
    enabled: !!userId,
  });

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity, sourcePostId }: { productId: string; quantity?: number; sourcePostId?: string }) =>
      addToCart(userId, productId, quantity, sourcePostId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yallmart-cart', userId] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (cartItemId: string) => removeFromCart(cartItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yallmart-cart', userId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) =>
      updateQuantity(cartItemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yallmart-cart', userId] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearCart(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yallmart-cart', userId] });
    },
  });

  return {
    cartItems,
    isLoading,
    addToCart: addMutation.mutateAsync,
    removeFromCart: removeMutation.mutateAsync,
    updateQuantity: updateMutation.mutateAsync,
    clearCart: clearMutation.mutateAsync,
  };
}
