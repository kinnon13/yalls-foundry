/**
 * Marketplace Service
 * 
 * Handles marketplace listing operations
 */

import { supabase } from '@/integrations/supabase/client';

export async function getAllListings(options?: {
  category?: string;
  search?: string;
}) {
  let query = supabase
    .from('marketplace_listings' as any)
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (options?.category) {
    query = query.eq('category_id', options.category);
  }

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from('marketplace_listings' as any)
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createListing(listing: {
  title: string;
  description?: string;
  price_cents: number;
  category_id?: string;
  stock_quantity: number;
  media?: any[];
  attributes?: any;
}) {
  const { data, error } = await supabase
    .from('marketplace_listings' as any)
    .insert({
      ...listing,
      seller_id: (await supabase.auth.getUser()).data.user?.id,
      status: 'draft',
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishListing(id: string) {
  const { data, error } = await supabase
    .from('marketplace_listings' as any)
    .update({ status: 'active' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addToCart(listingId: string, qty: number, sessionId: string) {
  const { data, error } = await supabase.rpc('cart_upsert_item', {
    p_listing_id: listingId,
    p_qty: qty,
    p_session_id: sessionId,
  });

  if (error) throw error;
  return data;
}
