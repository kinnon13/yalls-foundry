/**
 * Marketplace Supabase Adapter
 * Real implementation for marketplace operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { AppAdapter, AdapterContext, AdapterResult } from './types';

export const marketplaceAdapter: AppAdapter = {
  async execute(appId, actionId, params, ctx): Promise<AdapterResult> {
    try {
      switch (actionId) {
        case 'create_listing':
          return await createListing(params, ctx);
        
        case 'update_listing':
          return await updateListing(params, ctx);
        
        case 'delete_listing':
          return await deleteListing(params, ctx);
        
        case 'list_listings':
          return await listListings(params, ctx);
        
        case 'add_to_cart':
          return await addToCart(params, ctx);
        
        default:
          return {
            success: false,
            error: `Unknown marketplace action: ${actionId}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

async function createListing(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { title, description, price_cents, stock_quantity, category } = params;
  
  const { data, error } = await supabase
    .from('marketplace_listings')
    .insert({
      seller_profile_id: ctx.userId,
      title,
      description,
      price_cents,
      stock_quantity,
      category,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function updateListing(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { id, ...updates } = params;
  
  const { data, error } = await supabase
    .from('marketplace_listings')
    .update(updates)
    .eq('id', id)
    .eq('seller_profile_id', ctx.userId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function deleteListing(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { id } = params;
  
  const { error } = await supabase
    .from('marketplace_listings')
    .delete()
    .eq('id', id)
    .eq('seller_profile_id', ctx.userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

async function listListings(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { limit = 50, offset = 0, status = 'active' } = params;
  
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

async function addToCart(params: any, ctx: AdapterContext): Promise<AdapterResult> {
  const { listing_id, qty = 1, session_id } = params;
  
  const { data, error } = await supabase
    .rpc('cart_upsert_item', {
      p_listing_id: listing_id,
      p_qty: qty,
      p_session_id: session_id
    });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}
