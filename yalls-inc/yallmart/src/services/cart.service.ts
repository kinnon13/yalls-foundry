/**
 * Role: Cart service - one-tap add from social, Stripe/Venmo checkout
 * Path: yalls-inc/yallmart/src/services/cart.service.ts
 * Imports: @/integrations/supabase/client
 */

import { supabase } from '@/integrations/supabase/client';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  product_name?: string;
  product_price?: number;
  quantity: number;
  source_post_id?: string;
  created_at: string;
}

/**
 * Fetch user's cart items
 */
export async function fetchCart(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from('yallmart_cart_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Add item to cart (one-tap from social feed)
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number = 1,
  sourcePostId?: string
): Promise<void> {
  // Check if item already exists
  const { data: existing } = await supabase
    .from('yallmart_cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  if (existing) {
    // Update quantity
    const { error } = await supabase
      .from('yallmart_cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Insert new item
    const { error } = await supabase
      .from('yallmart_cart_items')
      .insert({
        user_id: userId,
        product_id: productId,
        quantity,
        source_post_id: sourcePostId,
      });

    if (error) throw error;
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(cartItemId: string): Promise<void> {
  const { error } = await supabase
    .from('yallmart_cart_items')
    .delete()
    .eq('id', cartItemId);

  if (error) throw error;
}

/**
 * Update cart item quantity
 */
export async function updateQuantity(cartItemId: string, quantity: number): Promise<void> {
  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { error } = await supabase
    .from('yallmart_cart_items')
    .update({ quantity })
    .eq('id', cartItemId);

  if (error) throw error;
}

/**
 * Clear entire cart
 */
export async function clearCart(userId: string): Promise<void> {
  const { error } = await supabase
    .from('yallmart_cart_items')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Create Stripe checkout session (stub)
 * TODO: Call edge function for secure Stripe checkout
 */
export async function createCheckoutSession(userId: string): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke('yallmart-checkout', {
    body: { user_id: userId },
  });

  if (error) throw error;
  return data;
}
