/**
 * Calendar App Contract
 */

import type { AppContract } from '@/kernel/types';

export const calendarContract: AppContract = {
  id: 'calendar',
  version: '1.0.0',
  name: 'Calendar',
  description: 'Event scheduling & calendar management',

  intents: [
    'schedule_event',
    'view_calendar',
    'manage_availability',
  ],

  actions: {
    create_event: {
      params: {
        title: 'string',
        startAt: 'datetime',
        endAt: 'datetime',
        location: 'string?',
        attendees: 'string?',
      },
    },
    update_event: {
      params: {
        eventId: 'uuid',
        title: 'string?',
        startAt: 'datetime?',
        endAt: 'datetime?',
      },
      permissions: ['owner', 'member'],
    },
    delete_event: {
      params: { eventId: 'uuid' },
      permissions: ['owner'],
    },
    rsvp_event: {
      params: {
        eventId: 'uuid',
        status: 'string', // 'yes' | 'no' | 'maybe'
      },
    },
    list_public: {
      params: {
        entityId: 'uuid',
        since: 'datetime?',
        until: 'datetime?',
        limit: 'number?',
      },
      permissions: [], // Public action
    },
  },

  events: {
    event_created: {
      properties: { id: 'uuid', title: 'string', startAt: 'datetime' },
    },
    event_updated: {
      properties: { id: 'uuid' },
    },
    rsvp_received: {
      properties: { eventId: 'uuid', userId: 'uuid', status: 'string' },
    },
  },

  contexts: ['user', 'business', 'farm'],

  capabilities: [
    'view',
    'create',
    'edit',
    'delete',
    'rsvp',
  ],

  permissions: {
    delete_event: ['owner'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'calendar',
  },
} as const;
