/**
 * Rate-Limited Marketplace Service
 * 
 * Wraps marketplace operations with rate limiting for billion-scale protection.
 * L0: Burst (in-memory), L1: Sustained (distributed), L2: Audit (logged)
 */

import { checkRateLimit, rateLimits } from '@/lib/rate-limit/enforce';
import { trackIdempotency } from '@/lib/availability/idempotency';
import { supabase } from '@/integrations/supabase/client';
import type { CartItemWithListing } from '@/entities/marketplace';
import * as baseService from './service.supabase';

/**
 * Rate-limited cart operations
 */
export async function addToCartRateLimited(listingId: string, quantity: number = 1) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // L0/L1 rate limit: 5 req/sec burst, 60 req/min sustained
  const limiterKey = `cart:add:${user.id}`;
  const result = await checkRateLimit(limiterKey, rateLimits.mutation);
  
  if (!result.allowed) {
    // L2: Log violation
    await logRateLimitViolation(user.id, 'cart:add', 'mutation');
    throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}s`);
  }

  return baseService.addToCart(listingId, quantity);
}

/**
 * Idempotent checkout with rate limiting
 */
export async function createCheckoutIdempotent(
  idempotencyKey: string,
  cartItems: CartItemWithListing[]
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Rate limit: 2 req/sec burst, 20 req/min sustained (stricter for checkout)
  const limiterKey = `checkout:${user.id}`;
  const result = await checkRateLimit(limiterKey, rateLimits.upload);
  
  if (!result.allowed) {
    await logRateLimitViolation(user.id, 'checkout', 'upload');
    throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}s`);
  }

  // Idempotent execution (prevents duplicate orders on retries)
  return trackIdempotency(idempotencyKey, async () => {
    // Call RPC for idempotent order creation
    const { data, error } = await (supabase as any).rpc('create_order_idempotent', {
      p_idempotency_key: idempotencyKey,
      p_cart_items: cartItems.map(item => ({
        listing_id: item.listing_id,
        quantity: item.quantity,
        price: item.variant?.price_cents ?? item.listing.base_price_cents,
      })),
      p_total_amount: cartItems.reduce((sum, item) => {
        const price = item.variant?.price_cents ?? item.listing.base_price_cents;
        return sum + (price * item.quantity);
      }, 0),
    });

    if (error) throw error;
    return data;
  });
}

/**
 * Rate-limited listing creation
 */
export async function createListingRateLimited(input: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Rate limit: 2 req/sec burst, 20 req/min sustained
  const limiterKey = `listing:create:${user.id}`;
  const result = await checkRateLimit(limiterKey, rateLimits.upload);
  
  if (!result.allowed) {
    await logRateLimitViolation(user.id, 'listing:create', 'upload');
    throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}s`);
  }

  return baseService.createListing(input);
}

/**
 * Rate-limited search (protects against scraping)
 */
export async function searchListingsRateLimited(filters?: {
  category?: string;
  search?: string;
  limit?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || 'anon';

  // Rate limit: 5 req/sec burst, 50 req/min sustained
  const limiterKey = `search:${userId}`;
  const result = await checkRateLimit(limiterKey, rateLimits.search);
  
  if (!result.allowed) {
    if (user) {
      await logRateLimitViolation(user.id, 'search', 'search');
    }
    throw new Error(`Rate limit exceeded. Retry after ${result.retryAfter}s`);
  }

  return baseService.getAllListings(filters);
}

/**
 * L2: Log rate limit violations for monitoring
 */
async function logRateLimitViolation(
  userId: string,
  route: string,
  limitType: string
) {
  try {
    await (supabase as any)
      .from('rate_limit_violations')
      .insert({
        user_id: userId,
        route,
        limit_type: limitType,
      });
  } catch (error) {
    console.error('Failed to log rate limit violation:', error);
  }
}
