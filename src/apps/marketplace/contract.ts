/**
 * Marketplace App Contract
 */

import type { AppContract } from '@/kernel/types';

export const marketplaceContract: AppContract = {
  id: 'marketplace',
  version: '1.0.0',
  name: 'Marketplace',
  description: 'Buy & sell listings with dual-tree MLM commission structure',

  intents: [
    'browse_listings',
    'create_listing',
    'purchase',
  ],

  // Commission structure (automatic):
  // - Platform 8%: 4% buyer upline (uncapped) + 4% seller upline (capped $100)
  // - Seller bonus (optional): 80% affiliate + 10% platform + 10% affiliate upline
  // - Creator account required to receive payouts
  // - 1-year expiration on unclaimed commissions

  actions: {
    create_listing: {
      params: {
        title: 'string',
        description: 'string',
        price: 'number',
        category: 'string',
        images: 'string?',
      },
      permissions: ['owner', 'member'],
    },
    publish_listing: {
      params: { listingId: 'uuid' },
      permissions: ['owner'],
    },
    unpublish_listing: {
      params: { listingId: 'uuid' },
      permissions: ['owner'],
    },
    delete_listing: {
      params: { listingId: 'uuid' },
      permissions: ['owner'],
    },
    add_to_cart: {
      params: {
        listingId: 'uuid',
        quantity: 'number',
      },
    },
  },

  events: {
    listing_created: {
      properties: { id: 'uuid', title: 'string' },
    },
    listing_published: {
      properties: { id: 'uuid' },
    },
    listing_sold: {
      properties: { id: 'uuid', buyerId: 'uuid' },
    },
  },

  contexts: ['user', 'business'],

  capabilities: [
    'browse',
    'create',
    'edit',
    'delete',
    'purchase',
  ],

  permissions: {
    publish_listing: ['owner'],
    delete_listing: ['owner'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'shopping-bag',
  },
} as const;
