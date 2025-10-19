/**
 * Discover App Contract
 */

import type { AppContract } from '@/kernel/types';

export const discoverContract: AppContract = {
  id: 'discover',
  version: '1.0.0',
  name: 'Discover',
  description: 'Content discovery & feed curation',

  intents: [
    'browse_content',
    'discover_creators',
    'explore_topics',
  ],

  actions: {
    view_reel: {
      params: { reelId: 'uuid' },
    },
    like_content: {
      params: { contentId: 'uuid', contentType: 'string' },
    },
    follow_creator: {
      params: { creatorId: 'uuid' },
    },
    unfollow_creator: {
      params: { creatorId: 'uuid' },
    },
    report_content: {
      params: {
        contentId: 'uuid',
        reason: 'string',
      },
    },
    list_public: {
      params: {
        entityId: 'uuid',
        limit: 'number?',
        filter: 'string?',
      },
      permissions: [], // Public action
    },
  },

  events: {
    reel_viewed: {
      properties: { id: 'uuid', duration: 'number' },
    },
    content_liked: {
      properties: { contentId: 'uuid', contentType: 'string' },
    },
    creator_followed: {
      properties: { creatorId: 'uuid' },
    },
  },

  contexts: ['user'],

  capabilities: [
    'browse',
    'like',
    'follow',
    'report',
  ],

  ui: {
    defaultMode: 'overlay',
    icon: 'compass',
  },
} as const;
