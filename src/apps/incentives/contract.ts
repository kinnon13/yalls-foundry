/**
 * Incentives App Contract
 */

import type { AppContract } from '@/kernel/types';

export const incentivesContract: AppContract = {
  id: 'incentives',
  version: '1.0.0',
  name: 'Incentives',
  description: 'Breeding incentive programs',

  intents: [
    'manage_programs',
    'track_rewards',
    'verify_eligibility',
  ],

  actions: {
    create_program: {
      params: {
        name: 'string',
        description: 'string',
        rewardAmount: 'number',
        criteria: 'string',
      },
      permissions: ['owner'],
    },
    enroll_stallion: {
      params: {
        programId: 'uuid',
        stallionId: 'uuid',
      },
    },
    claim_reward: {
      params: {
        programId: 'uuid',
        proofUrl: 'string?',
      },
    },
    verify_claim: {
      params: {
        claimId: 'uuid',
        approved: 'boolean',
      },
      permissions: ['owner'],
    },
    list_public: {
      params: {
        producerId: 'uuid',
        limit: 'number?',
        status: 'string?',
      },
      permissions: [], // Public action
    },
  },

  events: {
    program_created: {
      properties: { id: 'uuid', name: 'string' },
    },
    stallion_enrolled: {
      properties: { programId: 'uuid', stallionId: 'uuid' },
    },
    reward_claimed: {
      properties: { programId: 'uuid', userId: 'uuid', amount: 'number' },
    },
  },

  contexts: ['business', 'farm', 'stallion', 'producer'],

  capabilities: [
    'view',
    'create',
    'enroll',
    'claim',
    'verify',
  ],

  permissions: {
    create_program: ['owner'],
    verify_claim: ['owner'],
  },

  ui: {
    defaultMode: 'overlay',
    icon: 'award',
  },
} as const;
