/**
 * Analytics App Contract
 */

import type { AppContract } from '@/kernel/types';

export const analyticsContract: AppContract = {
  id: 'analytics',
  version: '1.0.0',
  name: 'Analytics',
  description: 'Business intelligence & insights',

  intents: [
    'view_metrics',
    'track_performance',
  ],

  actions: {
    view_dashboard: {
      params: {
        metric: 'string?',
        period: 'string?',
      },
    },
    export_report: {
      params: {
        reportType: 'string',
        startDate: 'datetime',
        endDate: 'datetime',
      },
      permissions: ['owner'],
    },
  },

  events: {
    dashboard_viewed: {
      properties: { metric: 'string' },
    },
    report_generated: {
      properties: { reportType: 'string' },
    },
  },

  contexts: ['business', 'farm', 'producer'],

  capabilities: [
    'view',
    'export',
  ],

  permissions: {
    export_report: ['owner'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'bar-chart',
  },
} as const;
