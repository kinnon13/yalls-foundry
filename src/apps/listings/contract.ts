/**
 * Listings App Contract
 */

import type { AppContract } from '@/kernel/types';

export const listingsContract: AppContract = {
  id: 'listings',
  version: '1.0.0',
  name: 'Listings',
  description: 'Manage product & service listings',

  intents: [
    'create_listing',
    'manage_inventory',
    'browse_shop',
  ],

  actions: {
    create_listing: {
      params: {
        title: 'string',
        description: 'string',
        price: 'number',
        category: 'string',
        images: 'string?',
        inventory: 'number?',
      },
      permissions: ['owner', 'member'],
    },
    update_listing: {
      params: {
        listingId: 'uuid',
        title: 'string?',
        price: 'number?',
        inventory: 'number?',
      },
      permissions: ['owner', 'member'],
    },
    publish_listing: {
      params: { listingId: 'uuid' },
      permissions: ['owner'],
    },
    archive_listing: {
      params: { listingId: 'uuid' },
      permissions: ['owner'],
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
      properties: { id: 'uuid', quantity: 'number' },
    },
  },

  contexts: ['user', 'business', 'farm'],

  capabilities: [
    'view',
    'create',
    'edit',
    'publish',
    'archive',
  ],

  permissions: {
    publish_listing: ['owner'],
    archive_listing: ['owner'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'package',
  },
} as const;
