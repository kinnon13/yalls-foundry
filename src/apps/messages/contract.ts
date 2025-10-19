/**
 * Messages App Contract
 */

import type { AppContract } from '@/kernel/types';

export const messagesContract: AppContract = {
  id: 'messages',
  version: '1.0.0',
  name: 'Messages',
  description: 'Direct messaging',

  intents: [
    'send_message',
    'read_messages',
  ],

  actions: {
    send_message: {
      params: {
        recipientId: 'uuid',
        body: 'string',
        attachments: 'string?',
      },
    },
    mark_read: {
      params: { messageId: 'uuid' },
    },
    delete_thread: {
      params: { threadId: 'uuid' },
    },
  },

  events: {
    message_sent: {
      properties: { id: 'uuid', recipientId: 'uuid' },
    },
    message_received: {
      properties: { id: 'uuid', senderId: 'uuid' },
    },
  },

  contexts: ['user'],

  capabilities: [
    'send',
    'receive',
    'delete',
  ],

  ui: {
    defaultMode: 'panel',
    icon: 'message-circle',
  },
} as const;
