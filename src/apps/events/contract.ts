/**
 * Events App Contract
 */

import type { AppContract } from '@/kernel/types';

export const eventsContract: AppContract = {
  id: 'events',
  version: '1.0.0',
  name: 'Events',
  description: 'Event management & ticketing',

  intents: [
    'create_event',
    'manage_tickets',
    'track_attendance',
  ],

  actions: {
    create_event: {
      params: {
        title: 'string',
        description: 'string',
        startAt: 'datetime',
        endAt: 'datetime',
        location: 'string',
        ticketPrice: 'number?',
        capacity: 'number?',
      },
      permissions: ['owner', 'member'],
    },
    update_event: {
      params: {
        eventId: 'uuid',
        title: 'string?',
        startAt: 'datetime?',
        capacity: 'number?',
      },
      permissions: ['owner', 'member'],
    },
    cancel_event: {
      params: { eventId: 'uuid' },
      permissions: ['owner'],
    },
    register_attendee: {
      params: {
        eventId: 'uuid',
        ticketType: 'string?',
      },
    },
  },

  events: {
    event_created: {
      properties: { id: 'uuid', title: 'string' },
    },
    ticket_purchased: {
      properties: { eventId: 'uuid', userId: 'uuid', quantity: 'number' },
    },
    event_cancelled: {
      properties: { id: 'uuid' },
    },
  },

  contexts: ['user', 'business', 'farm'],

  capabilities: [
    'view',
    'create',
    'edit',
    'cancel',
    'register',
  ],

  permissions: {
    cancel_event: ['owner'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'ticket',
  },
} as const;
