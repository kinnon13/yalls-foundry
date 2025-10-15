/**
 * Marketplace Service (Supabase)
 * 
 * Handles marketplace operations: listings, cart, orders, checkout.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Listing, CreateListingInput, CartItem, CartItemWithListing, Order } from '@/entities/marketplace';

// ============================================================
// LISTINGS
// ============================================================
export async function getAllListings(filters?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<Listing[]> {
  let query = (supabase as any)
    .from('marketplace_listings')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (filters?.category) {
    query = query.eq('category_slug', filters.category);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Listing[];
}

export async function getListingById(id: string): Promise<Listing | null> {
  const { data, error } = await (supabase as any)
    .from('marketplace_listings')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Listing | null;
}

export async function createListing(input: CreateListingInput): Promise<Listing> {
  const { data, error } = await (supabase as any)
    .from('marketplace_listings')
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Listing;
}

export async function updateListing(id: string, updates: Partial<CreateListingInput>): Promise<Listing> {
  const { data, error } = await (supabase as any)
    .from('marketplace_listings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Listing;
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('marketplace_listings')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

// ============================================================
// SHOPPING CART
// ============================================================
export async function getMyCart(): Promise<CartItemWithListing[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  const { data, error } = await (supabase as any)
    .from('shopping_carts')
    .select(`
      *,
      listing:marketplace_listings(*)
    `)
    .eq('user_id', session.session.user.id)
    .order('added_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as CartItemWithListing[];
}

export async function addToCart(listingId: string, quantity: number = 1): Promise<CartItem> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) throw new Error('Not authenticated');

  const { data, error } = await (supabase as any)
    .from('shopping_carts')
    .upsert({
      user_id: session.session.user.id,
      listing_id: listingId,
      quantity,
    }, {
      onConflict: 'user_id,listing_id',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CartItem;
}

export async function updateCartQuantity(cartItemId: string, quantity: number): Promise<CartItem> {
  const { data, error } = await (supabase as any)
    .from('shopping_carts')
    .update({ quantity })
    .eq('id', cartItemId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CartItem;
}

export async function removeFromCart(cartItemId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('shopping_carts')
    .delete()
    .eq('id', cartItemId);

  if (error) throw new Error(error.message);
}

export async function clearCart(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return;

  const { error } = await (supabase as any)
    .from('shopping_carts')
    .delete()
    .eq('user_id', session.session.user.id);

  if (error) throw new Error(error.message);
}

// ============================================================
// ORDERS
// ============================================================
export async function getMyOrders(limit?: number): Promise<Order[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  let query = (supabase as any)
    .from('orders')
    .select('*')
    .eq('buyer_user_id', session.session.user.id)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Order[];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const { data, error } = await (supabase as any)
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Order | null;
}

// ============================================================
// CHECKOUT
// ============================================================
export async function createCheckoutSession(cartItems: CartItemWithListing[]): Promise<{
  orderId: string;
  clientSecret: string;
}> {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { cartItems },
  });

  if (error) throw new Error(error.message || 'Failed to create checkout session');
  return data;
}
