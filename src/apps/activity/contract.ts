/**
 * Activity App Contract
 */

import type { AppContract } from '@/kernel/types';

export const activityContract: AppContract = {
  id: 'activity',
  version: '1.0.0',
  name: 'Activity',
  description: 'Activity feed & AI ledger',

  intents: [
    'view_activity',
    'track_actions',
  ],

  actions: {
    view_ledger: {
      params: {
        startDate: 'datetime?',
        endDate: 'datetime?',
        appId: 'string?',
      },
    },
    clear_history: {
      params: { before: 'datetime' },
      permissions: ['owner'],
    },
  },

  events: {
    ledger_viewed: {
      properties: { count: 'number' },
    },
  },

  contexts: ['user', 'business', 'farm'],

  capabilities: [
    'view',
    'export',
  ],

  permissions: {
    clear_history: ['owner'],
  },

  ui: {
    defaultMode: 'panel',
    icon: 'activity',
  },
} as const;
