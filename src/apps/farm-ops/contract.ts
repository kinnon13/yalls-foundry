/**
 * Farm Ops App Contract
 */

import type { AppContract } from '@/kernel/types';

export const farmOpsContract: AppContract = {
  id: 'farm-ops',
  version: '1.0.0',
  name: 'Farm Ops',
  description: 'Farm operations & breeding management',

  intents: [
    'manage_operations',
    'track_breedings',
    'schedule_tasks',
  ],

  actions: {
    log_breeding: {
      params: {
        stallionId: 'uuid',
        mareId: 'uuid',
        date: 'datetime',
        method: 'string',
      },
      permissions: ['owner', 'member'],
    },
    schedule_task: {
      params: {
        title: 'string',
        dueDate: 'datetime',
        assigneeId: 'uuid?',
        animalId: 'uuid?',
      },
      permissions: ['owner', 'member'],
    },
    complete_task: {
      params: { taskId: 'uuid' },
    },
    record_health: {
      params: {
        animalId: 'uuid',
        type: 'string',
        notes: 'string',
        vetId: 'uuid?',
      },
    },
  },

  events: {
    breeding_logged: {
      properties: { id: 'uuid', stallionId: 'uuid', mareId: 'uuid' },
    },
    task_scheduled: {
      properties: { id: 'uuid', title: 'string', dueDate: 'datetime' },
    },
    task_completed: {
      properties: { id: 'uuid' },
    },
  },

  contexts: ['farm', 'stallion'],

  capabilities: [
    'view',
    'log',
    'schedule',
    'track',
  ],

  permissions: {
    log_breeding: ['owner', 'member'],
    schedule_task: ['owner', 'member'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'tractor',
  },
} as const;
