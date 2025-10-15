/**
 * Marketplace Entity Types
 * 
 * Types for marketplace listings, carts, orders, ledger, reviews, and variants.
 * Billion-proof schema with dynamic attributes and multi-vendor support.
 */

import { z } from 'zod';

// ============================================================
// MARKETPLACE LISTING
// ============================================================
export const ListingSchema = z.object({
  id: z.string().uuid(),
  seller_business_id: z.string().uuid(),
  slug: z.string(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  base_price_cents: z.number().int().min(0),
  
  // Inventory
  track_inventory: z.boolean().default(true),
  stock_quantity: z.number().int().min(0).default(0),
  allow_backorder: z.boolean().default(false),
  low_stock_threshold: z.number().int().default(10),
  
  // Dynamic fields
  custom_fields: z.record(z.any()).default({}),
  attributes: z.record(z.any()).default({}),
  
  // Variants
  has_variants: z.boolean().default(false),
  variant_options: z.record(z.array(z.string())).default({}),
  
  // Organization
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  
  // Status
  status: z.enum(['draft', 'active', 'archived', 'out_of_stock']).default('draft'),
  featured: z.boolean().default(false),
  
  // Search
  embedding: z.any().optional(),
  search_vector: z.any().optional(),
  
  // Metadata
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
  published_at: z.string().optional(),
});

export type Listing = z.infer<typeof ListingSchema>;

export const CreateListingSchema = z.object({
  seller_business_id: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  base_price_cents: z.number().int().min(0),
  category: z.string().optional(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  custom_fields: z.record(z.any()).optional(),
  attributes: z.record(z.any()).optional(),
  stock_quantity: z.number().int().min(0).default(0),
  track_inventory: z.boolean().default(true),
  status: z.enum(['draft', 'active']).default('draft'),
});

export type CreateListingInput = z.infer<typeof CreateListingSchema>;

// ============================================================
// LISTING VARIANTS
// ============================================================
export const VariantSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  sku: z.string().optional(),
  variant_name: z.string(),
  variant_attributes: z.record(z.string()),
  price_cents: z.number().int().min(0),
  stock_quantity: z.number().int().min(0).default(0),
  images: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Variant = z.infer<typeof VariantSchema>;

export const CreateVariantSchema = z.object({
  listing_id: z.string().uuid(),
  sku: z.string().optional(),
  variant_name: z.string(),
  variant_attributes: z.record(z.string()),
  price_cents: z.number().int().min(0),
  stock_quantity: z.number().int().min(0).default(0),
  images: z.array(z.string()).optional(),
});

export type CreateVariantInput = z.infer<typeof CreateVariantSchema>;

// ============================================================
// SHOPPING CART
// ============================================================
export const CartSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  expires_at: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Cart = z.infer<typeof CartSchema>;

export const CartItemSchema = z.object({
  id: z.string().uuid(),
  cart_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  price_cents: z.number().int().min(0),
  added_at: z.string(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

export type CartItemWithListing = CartItem & {
  listing: Listing;
  variant?: Variant;
};

// ============================================================
// ORDER
// ============================================================
export const OrderSchema = z.object({
  id: z.string().uuid(),
  order_number: z.string(),
  buyer_user_id: z.string().uuid(),
  
  // Totals
  subtotal_cents: z.number().int().min(0),
  tax_cents: z.number().int().min(0).default(0),
  shipping_cents: z.number().int().min(0).default(0),
  discount_cents: z.number().int().min(0).default(0),
  total_cents: z.number().int().min(0),
  
  // Payment
  payment_status: z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']),
  payment_method: z.string().optional(),
  payment_intent_id: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  
  // Fulfillment
  fulfillment_status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  
  // Info
  shipping_address: z.any().optional(),
  billing_address: z.any().optional(),
  customer_email: z.string().optional(),
  customer_phone: z.string().optional(),
  
  // Multi-vendor
  requires_split: z.boolean().default(false),
  
  // Metadata
  notes: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Order = z.infer<typeof OrderSchema>;

export const OrderLineItemSchema = z.object({
  id: z.string().uuid(),
  order_id: z.string().uuid(),
  order_created_at: z.string(),
  seller_business_id: z.string().uuid(),
  listing_id: z.string().uuid(),
  variant_id: z.string().uuid().optional(),
  quantity: z.number().int().min(1),
  price_cents: z.number().int().min(0),
  discount_cents: z.number().int().min(0).default(0),
  tax_cents: z.number().int().min(0).default(0),
  fulfillment_status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
  tracking_number: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
});

export type OrderLineItem = z.infer<typeof OrderLineItemSchema>;

// ============================================================
// LEDGER
// ============================================================
export const LedgerEntrySchema = z.object({
  id: z.string().uuid(),
  idempotency_key: z.string(),
  entry_type: z.enum(['order_payment', 'mlm_commission', 'seller_payout', 'refund', 'fee', 'adjustment']),
  amount_cents: z.number().int(),
  balance_cents: z.number().int().optional(),
  order_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  business_id: z.string().uuid().optional(),
  description: z.string().optional(),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
});

export type LedgerEntry = z.infer<typeof LedgerEntrySchema>;

// ============================================================
// REVIEWS
// ============================================================
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  listing_id: z.string().uuid(),
  order_id: z.string().uuid().optional(),
  reviewer_user_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  content: z.string().optional(),
  images: z.array(z.string()).default([]),
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']).default('pending'),
  moderated_by: z.string().uuid().optional(),
  moderated_at: z.string().optional(),
  seller_response: z.string().optional(),
  seller_responded_at: z.string().optional(),
  helpful_count: z.number().int().default(0),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewSchema = z.object({
  listing_id: z.string().uuid(),
  order_id: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  content: z.string().max(5000).optional(),
  images: z.array(z.string()).optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ============================================================
// SELLER PROFILE
// ============================================================
export const SellerProfileSchema = z.object({
  business_id: z.string().uuid(),
  verification_status: z.enum(['pending', 'verified', 'rejected', 'suspended']).default('pending'),
  verified_at: z.string().optional(),
  total_sales_cents: z.number().int().default(0),
  total_orders: z.number().int().default(0),
  avg_rating: z.number().default(0),
  total_reviews: z.number().int().default(0),
  return_policy: z.string().optional(),
  shipping_policy: z.string().optional(),
  refund_policy: z.string().optional(),
  stripe_connect_account_id: z.string().optional(),
  payout_enabled: z.boolean().default(false),
  settings: z.record(z.any()).default({}),
  metadata: z.record(z.any()).default({}),
  created_at: z.string(),
  updated_at: z.string(),
});

export type SellerProfile = z.infer<typeof SellerProfileSchema>;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateCartTotal(items: CartItemWithListing[]): number {
  return items.reduce((sum, item) => {
    const price = item.variant?.price_cents ?? item.listing.base_price_cents;
    return sum + (price * item.quantity);
  }, 0);
}

export function calculateOrderTotal(order: Order): number {
  return order.subtotal_cents + order.tax_cents + order.shipping_cents - order.discount_cents;
}

export function getEffectivePrice(listing: Listing, variant?: Variant): number {
  return variant?.price_cents ?? listing.base_price_cents;
}

export function getStockQuantity(listing: Listing, variant?: Variant): number {
  return variant?.stock_quantity ?? listing.stock_quantity;
}

export function isInStock(listing: Listing, variant?: Variant, quantity: number = 1): boolean {
  if (!listing.track_inventory) return true;
  const stock = getStockQuantity(listing, variant);
  return stock >= quantity || (listing.allow_backorder && stock >= 0);
}
