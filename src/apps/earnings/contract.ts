/**
 * Earnings App Contract
 */

import type { AppContract } from '@/kernel/types';

export const earningsContract: AppContract = {
  id: 'earnings',
  version: '1.0.0',
  name: 'Earnings',
  description: 'Revenue tracking & payouts',

  intents: [
    'track_revenue',
    'manage_payouts',
    'view_analytics',
  ],

  actions: {
    record_sale: {
      params: {
        amount: 'number',
        source: 'string',
        itemId: 'uuid?',
      },
    },
    request_payout: {
      params: {
        amount: 'number',
        method: 'string',
      },
      permissions: ['owner'],
    },
    view_statement: {
      params: {
        startDate: 'datetime',
        endDate: 'datetime',
      },
    },
  },

  events: {
    sale_recorded: {
      properties: { id: 'uuid', amount: 'number', source: 'string' },
    },
    payout_requested: {
      properties: { id: 'uuid', amount: 'number' },
    },
    payout_completed: {
      properties: { id: 'uuid', amount: 'number' },
    },
  },

  contexts: ['business', 'farm', 'producer'],

  capabilities: [
    'view',
    'record',
    'payout',
    'analytics',
  ],

  permissions: {
    request_payout: ['owner'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'dollar-sign',
  },
} as const;
