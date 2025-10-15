/**
 * Marketplace Entity Types
 * 
 * Types for marketplace listings, carts, orders, and ledger.
 */

import { z } from 'zod';

// ============================================================
// MARKETPLACE LISTING
// ============================================================
export const ListingSchema = z.object({
  id: z.string().uuid(),
  seller_business_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  price_cents: z.number().int().min(0),
  stock_quantity: z.number().int().min(0),
  images: z.array(z.string()).default([]),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  embedding: z.any().optional(),
  active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Listing = z.infer<typeof ListingSchema>;

export const CreateListingSchema = z.object({
  seller_business_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  price_cents: z.number().int().min(0),
  stock_quantity: z.number().int().min(0),
  images: z.array(z.string()).default([]),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

// ============================================================
// SHOPPING CART
// ============================================================
export const CartItemSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  added_at: z.string(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export type CartItemWithListing = CartItem & {
  listing: Listing;
};

// ============================================================
// ORDER
// ============================================================
export const OrderSchema = z.object({
  id: z.string().uuid(),
  buyer_user_id: z.string().uuid(),
  total_cents: z.number().int().min(0),
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded']),
  payment_intent_id: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  shipping_address: z.any().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

export const OrderLineItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  seller_business_id: z.string().uuid(),
  quantity: z.number().int().min(1),
  price_cents: z.number().int().min(0),
  created_at: z.string(),
});

export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;

// ============================================================
// LEDGER
// ============================================================
export const LedgerEntrySchema = z.object({
  id: z.string().uuid(),
  idempotency_key: z.string(),
  entry_type: z.enum(['order_payment', 'mlm_commission', 'payout', 'refund']),
  order_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  amount_cents: z.number().int(),
  balance_cents: z.number().int(),
  metadata: z.any().default({}),
  created_at: z.string(),
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateCartTotal(items: CartItemWithListing[]): number {
  return items.reduce((sum, item) => sum + (item.listing.price_cents * item.quantity), 0);
}
