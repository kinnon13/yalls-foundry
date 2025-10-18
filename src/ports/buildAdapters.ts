/**
 * Adapter Registry Builder
 * Single switch between mock (localStorage) and DB (Supabase RPC) adapters
 */

import { favoritesMock } from '@/adapters/mock/favorites.mock';
import { repostsMock } from '@/adapters/mock/reposts.mock';
import { linkedAccountsMock } from '@/adapters/mock/linkedAccounts.mock';
import { entityEdgesMock } from '@/adapters/mock/entityEdges.mock';

import { favoritesDb } from '@/adapters/db/favorites.db';
import { repostsDb } from '@/adapters/db/reposts.db';
import { linkedAccountsDb } from '@/adapters/db/linkedAccounts.db';
import { entityEdgesDb } from '@/adapters/db/entityEdges.db';

export type PortsMode = 'mock' | 'db';

export function buildAdapters(mode: PortsMode) {
  const useDb = mode === 'db';
  return {
    favorites: useDb ? favoritesDb : favoritesMock,
    reposts: useDb ? repostsDb : repostsMock,
    linkedAccounts: useDb ? linkedAccountsDb : linkedAccountsMock,
    entityEdges: useDb ? entityEdgesDb : entityEdgesMock,
  };
}
