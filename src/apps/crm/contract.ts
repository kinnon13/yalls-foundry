/**
 * CRM App Contract
 */

import type { AppContract } from '@/kernel/types';

export const crmContract: AppContract = {
  id: 'crm',
  version: '1.0.0',
  name: 'CRM',
  description: 'Contact & relationship management',
  
  intents: [
    'manage_contacts',
    'follow_up',
    'track_relationships',
  ],

  actions: {
    create_contact: {
      params: {
        name: 'string',
        phone: 'string?',
        email: 'string?',
        tags: 'string?',
      },
    },
    update_contact: {
      params: {
        contactId: 'uuid',
        name: 'string?',
        phone: 'string?',
        email: 'string?',
      },
      permissions: ['owner', 'member'],
    },
    delete_contact: {
      params: { contactId: 'uuid' },
      permissions: ['owner'],
    },
    schedule_followup: {
      params: {
        contactId: 'uuid',
        date: 'datetime',
        note: 'string?',
      },
    },
    import_contacts: {
      params: { source: 'string', fileUrl: 'string' },
      permissions: ['owner'],
    },
  },

  events: {
    contact_created: {
      properties: { id: 'uuid', name: 'string' },
    },
    contact_updated: {
      properties: { id: 'uuid' },
    },
    followup_scheduled: {
      properties: { contactId: 'uuid', due: 'datetime' },
    },
    followup_due: {
      properties: { contactId: 'uuid', due: 'datetime' },
    },
  },

  contexts: ['user', 'business', 'farm'],
  
  capabilities: [
    'view',
    'create',
    'edit',
    'delete',
    'import',
    'export',
    'search',
  ],

  permissions: {
    delete_contact: ['owner'],
    import_contacts: ['owner'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'contact',
  },
} as const;
