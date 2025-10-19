/**
 * Rocker Integration: Marketplace
 * 
 * Connects marketplace operations to Rocker event bus.
 * Enables Rocker to recommend listings, track interests, and prompt referrals.
 */

import { emitRockerEvent } from '../bus';
import { supabase } from '@/integrations/supabase/client';

export async function rockerListingCreated(params: {
  userId: string;
  listingId: string;
  title: string;
  price: number;
  category: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.create.listing', params.userId, {
    listingId: params.listingId,
    title: params.title,
    price: params.price,
    category: params.category,
  }, params.sessionId);

  // Rocker should suggest:
  // - Similar listings to compare pricing
  // - Tags/keywords to add
  // - Cross-posting opportunities
}

export async function rockerListingViewed(params: {
  userId: string;
  listingId: string;
  category: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.view.listing', params.userId, {
    listingId: params.listingId,
    category: params.category,
  }, params.sessionId);

  // Emit signal for social matching
  await supabase.rpc('emit_signal', {
    p_name: 'pdp_view',
    p_target_kind: 'listing',
    p_target_id: params.listingId,
    p_metadata: { category: params.category }
  });

  // Rocker may suggest:
  // - Similar listings
  // - Price alerts
  // - Seller connection
}

export async function rockerPurchaseCompleted(params: {
  userId: string;
  listingId: string;
  amount: number;
  orderId: string;
  affiliateReferrerId?: string;
  sessionId?: string;
}): Promise<void> {
  await emitRockerEvent('user.purchase.listing', params.userId, {
    listingId: params.listingId,
    amount: params.amount,
    orderId: params.orderId,
    affiliateReferrerId: params.affiliateReferrerId,
  }, params.sessionId);

  // Rocker should:
  // - Update purchase history
  // - Suggest related products
  // - Track MLM referral chain (buyer → seller → affiliate uplines)
  // - Commission distribution triggers automatically via order status='paid'
  // - Remind sellers to print labels within 7 days (or order reverses)
  // - Commissions release 14 days after label printing
}
