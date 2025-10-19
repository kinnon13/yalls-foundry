/**
 * Favorites App Contract
 */

import type { AppContract } from '@/kernel/types';

export const favoritesContract: AppContract = {
  id: 'favorites',
  version: '1.0.0',
  name: 'Favorites',
  description: 'Saved items & bookmarks',

  intents: [
    'save_content',
    'organize_favorites',
  ],

  actions: {
    add_favorite: {
      params: {
        itemId: 'uuid',
        itemType: 'string',
        collectionId: 'uuid?',
      },
    },
    remove_favorite: {
      params: { favoriteId: 'uuid' },
    },
    create_collection: {
      params: {
        name: 'string',
        description: 'string?',
      },
    },
  },

  events: {
    favorite_added: {
      properties: { itemId: 'uuid', itemType: 'string' },
    },
    collection_created: {
      properties: { id: 'uuid', name: 'string' },
    },
  },

  contexts: ['user'],

  capabilities: [
    'view',
    'add',
    'remove',
    'organize',
  ],

  ui: {
    defaultMode: 'panel',
    icon: 'heart',
  },
} as const;
